import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ensureUnderstandingIgnore, isSetUp, loadConfig } from './config.js';
import { pickZone, targetPath, zoneContext } from './context.js';
import { repoRootOf } from './git.js';
import { onPostToolUse, onStop } from './hooks.js';
import { buildMap } from './pipeline.js';
import { ghAvailable, readReviewCache, reviewCountsByPath, type PathCounts } from './reviews.js';
import { renderReport, writeReport } from './report.js';
import { handoffSet, markUnverifiable, recordResult, skipHandoff, type Grade } from './record.js';
import { runSetup } from './setup.js';
import { mapLineCounter, StoryboardError } from './storyboard.js';
import { checkStoryboard, renderVisual, type LiveZone } from './visual.js';
import { checkFresh, freshVisuals, readSavedVisual, saveVisual, visualFingerprint } from './visual-store.js';
import { formatSummary, formatWho } from './terminal.js';
import type { Config, MapResult, ZoneResult } from './types.js';

type Command = (args: string[]) => Promise<number>;

const out = (s: string) => void process.stdout.write(s.endsWith('\n') ? s : s + '\n');
const err = (s: string) => void process.stderr.write(s.endsWith('\n') ? s : s + '\n');

function parseArgs(args: string[]): { flags: Set<string>; positional: string[] } {
  const flags = new Set<string>();
  const positional: string[] = [];
  for (const a of args) {
    if (a.startsWith('--')) flags.add(a);
    else positional.push(a);
  }
  return { flags, positional };
}

/** Resolves the repo root, or prints the not-a-repository message and yields null. */
function requireRoot(): string | null {
  const root = repoRootOf(process.cwd());
  if (!root) err('Understanding Map needs a git repository. Run it from inside one.');
  return root;
}

/** Wraps a command so a repo is required and unexpected errors become one line on stderr with exit code 1. */
function guarded(body: (root: string, args: string[]) => Promise<number> | number): Command {
  return async (args) => {
    const root = requireRoot();
    if (!root) return 2;
    try {
      return await body(root, args);
    } catch (e) {
      if (process.env.UMAP_DEBUG === '1') err((e as Error).stack ?? String(e));
      else err(`Understanding Map failed: ${(e as Error).message.split('\n')[0]}`);
      return 1;
    }
  };
}

function findZone(m: MapResult, root: string, target: string): ZoneResult | null {
  const byId = m.zones.find((z) => z.zone.id === target);
  if (byId) return byId;
  const path = targetPath(root, target);
  const file = m.zones.find((z) => z.zone.files.includes(path));
  if (file) return file;
  const dir = path.replace(/\/+$/, '') + '/';
  return m.zones.find((z) => z.zone.files.some((f) => f.startsWith(dir))) ?? null;
}

export interface ReviewDeps {
  ghAvailable: (root: string) => boolean;
  run?: (args: string[], timeoutMs: number) => string;
}

/**
 * PR review signal via gh, only when `githubReviews` is on (opt-in; off by default, so no network calls) and
 * UMAP_NO_GH is not "1". A fresh cache is used before gh is even probed. Any failure yields no reviews and never
 * affects the map.
 */
export function optionalReviews(root: string, config: Config, deps: ReviewDeps = { ghAvailable }): PathCounts {
  try {
    if (!config.githubReviews || process.env.UMAP_NO_GH === '1') return {};
    const cached = readReviewCache(root);
    if (cached) return cached;
    if (!deps.ghAvailable(root)) return {};
    return reviewCountsByPath(root, deps.run);
  } catch {
    return {};
  }
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const GRADES = ['pass', 'partial', 'miss'];
const valueOf = (args: string[], flag: string): string | undefined => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};

async function readStdin(): Promise<string> {
  let text = '';
  for await (const chunk of process.stdin) text += String(chunk);
  return text;
}

const liveZone = (z: ZoneResult): LiveZone => ({ id: z.zone.id, state: z.state, reason: z.reason, fanIn: z.criticality.fanIn });
const storyboardContext = (root: string, m: MapResult, zoneId: string) => ({
  zone: zoneId,
  zones: Object.fromEntries(m.zones.map((z) => [z.zone.id, z.zone.files])),
  lineCount: mapLineCounter(root, m.zones.flatMap((z) => z.zone.files)),
  people: [...new Set(m.zones.flatMap((z) => z.people.map((p) => p.handle)))],
});

export const commands: Record<string, Command> = {
  /** Hook entry point: not guarded; reads stdin, never throws, always exits 0. */
  hook: async (args) => {
    try {
      let input: unknown = null;
      try { input = JSON.parse(await readStdin()); } catch { /* malformed or empty input */ }
      if (args[0] === 'post-tool-use') onPostToolUse(input);
      else if (args[0] === 'stop') {
        const text = onStop(input);
        if (text) out(text);
      }
    } catch { /* hooks never fail */ }
    return 0;
  },

  status: guarded((root, args) => {
    const setUp = isSetUp(root);
    const mode = loadConfig(root).mode;
    if (parseArgs(args).flags.has('--json')) out(JSON.stringify({ setUp, mode, root }));
    else out(setUp ? `Understanding Map is set up (${mode} mode) in ${root}` : 'Understanding Map is not set up yet. Run /understanding-map:setup.');
    return 0;
  }),

  setup: guarded((root, args) => {
    const valueOf = (flag: string): string | undefined => {
      const i = args.indexOf(flag);
      return i >= 0 ? args[i + 1] : undefined;
    };
    const mode = valueOf('--mode');
    if (mode !== 'solo' && mode !== 'team') {
      err('Usage: setup --mode solo|team [--critical "<glob>,<glob>"]');
      return 2;
    }
    // Existing critical globs are kept unless --critical is passed; an explicit empty value clears them.
    const critical = args.includes('--critical')
      ? (valueOf('--critical') ?? '').split(',').map((g) => g.trim()).filter(Boolean)
      : undefined;
    const r = runSetup(root, { mode, critical });
    const lines = [
      `Set up Understanding Map in ${mode} mode.`,
      `Wrote ${relative(root, r.configPath)}${r.critical.length ? ` with critical areas: ${r.critical.join(', ')}` : ''}.`,
      mode === 'solo'
        ? 'Everything in .understanding/ stays on this machine (it is ignored by git).'
        : 'Local data and the HTML report are ignored by git; passes and anonymous zone totals can be shared.',
    ];
    if (r.gitattributesLines.length) lines.push(`Added ${r.gitattributesLines.length} merge rule(s) to .gitattributes so shared files merge cleanly.`);
    if (mode === 'team') lines.push('Commit .understanding/config.json, .understanding/.gitignore, events/ and agent-share/ with your normal commits — only passes and anonymous zone totals are shared.');
    out(lines.join('\n'));
    return 0;
  }),

  map: guarded((root, args) => {
    ensureUnderstandingIgnore(root);
    const config = loadConfig(root);
    const m = buildMap(root, { reviewsByPath: optionalReviews(root, config) });
    const { flags } = parseArgs(args);
    let reportPath: string | null = null;
    if (!flags.has('--no-report')) {
      try {
        let visuals: Record<string, string> = {};
        try { visuals = freshVisuals(root, m.zones.map((z) => ({ id: z.zone.id, files: z.zone.files }))); } catch { /* no links */ }
        reportPath = writeReport(root, renderReport(m, { ...config, visuals }));
      } catch (e) {
        err(`Could not write the HTML report: ${(e as Error).message.split('\n')[0]}`);
      }
    }
    if (flags.has('--json')) {
      out(JSON.stringify(m));
      return 0;
    }
    let text = formatSummary(m, reportPath);
    if (!isSetUp(root)) text += '\nNot set up yet — run /understanding-map:setup to choose solo or team.';
    out(text);
    return 0;
  }),

  zone: guarded((root, args) => {
    const { flags, positional } = parseArgs(args);
    if (!positional[0]) {
      err('Usage: zone <id|path> [--json]');
      return 2;
    }
    const m = buildMap(root);
    const z = findZone(m, root, positional[0]);
    if (!z) {
      err(`No zone found for "${positional[0]}".`);
      return 1;
    }
    out(flags.has('--json') ? JSON.stringify(z) : formatWho(z, m.mode, { threshold: loadConfig(root).threshold, me: m.me }));
    return 0;
  }),

  who: guarded((root, args) => {
    const target = parseArgs(args).positional[0];
    if (!target) {
      err('Usage: who <path>');
      return 2;
    }
    const m = buildMap(root);
    const z = findZone(m, root, target);
    if (!z) {
      err(`No zone found for "${target}".`);
      return 1;
    }
    out(formatWho(z, m.mode, { threshold: loadConfig(root).threshold, me: m.me }));
    return 0;
  }),

  record: guarded((root, args) => {
    const kind = valueOf(args, '--kind');
    const grades = (valueOf(args, '--grades') ?? '').split(',').map((g) => g.trim()).filter(Boolean);
    const zones = (valueOf(args, '--zones') ?? '').split(',').map((z) => z.trim()).filter(Boolean);
    if ((kind !== 'session' && kind !== 'handoff') || grades.length < 1 || grades.length > 3 || !grades.every((g) => GRADES.includes(g))
      || (kind === 'session' && zones.length === 0)) {
      err('Usage: record --kind session|handoff [--zones <id,id>] --grades pass|partial|miss[,...] (1-3 grades; --zones required for session) [--json]');
      return 2;
    }
    if (kind === 'handoff' && handoffSet(root).zones.length === 0) {
      err('Nothing to check — no agent changes since the last check.');
      return 2;
    }
    if (kind === 'session') {
      const known = new Set(buildMap(root).zones.map((z) => z.zone.id));
      const bad = zones.filter((z) => !known.has(z));
      if (bad.length) {
        err(`Unknown zone: ${bad.join(', ')}. Run map to see zone ids.`);
        return 2;
      }
    }
    const r = recordResult(root, { kind, zones, grades: grades as Grade[] });
    // Text and --json report the same changes: only zones whose state or level actually moved.
    const changes = r.changes.filter((c) => c.before !== c.after || c.levelBefore !== c.levelAfter);
    if (parseArgs(args).flags.has('--json')) out(JSON.stringify({ result: r.result, changes }));
    else {
      out([
        `Result: ${r.result}`,
        ...(changes.length
          ? changes.map((c) => `${c.zone}: ${cap(c.before)} → ${cap(c.after)} (level ${c.levelBefore} → ${c.levelAfter})`)
          : ['No change on the map.']),
      ].join('\n'));
    }
    return 0;
  }),

  unverifiable: guarded((root, args) => {
    const zone = valueOf(args, '--zone');
    if (!zone) {
      err('Usage: unverifiable --zone <id>');
      return 2;
    }
    markUnverifiable(root, zone);
    out(`Marked ${zone} as hard to verify.`);
    return 0;
  }),

  'handoff-set': guarded((root, args) => {
    const s = handoffSet(root);
    out(parseArgs(args).flags.has('--json')
      ? JSON.stringify(s)
      : s.zones.length
        ? `${s.totalLines} agent-written lines across ${s.zones.length} zone(s): ${s.zones.map((z) => `${z.zone} (${z.lines})`).join(', ')}`
        : 'Nothing to check — no agent changes since the last check.');
    return 0;
  }),

  'handoff-skip': guarded((root) => {
    skipHandoff(root);
    out('Skipped the handoff check; touched zones are flagged as unreviewed agent code.');
    return 0;
  }),

  context: guarded((root, args) => {
    const { flags, positional } = parseArgs(args);
    const m = buildMap(root);
    const p = pickZone(m, root, positional[0]);
    if (!p.zone) {
      if (positional[0]) {
        err(p.why);
        return 1;
      }
      out(flags.has('--json') ? JSON.stringify({ zone: null, why: p.why }) : p.why);
      return 0;
    }
    const c = zoneContext(root, m, p.zone, p.picked);
    if (flags.has('--json')) out(JSON.stringify(c));
    else {
      const names = (ns: typeof c.inbound) => (ns.length ? ns.map((n) => n.zone).join(', ') : 'none');
      out([
        `${c.zone.id} — ${c.picked.note}`,
        `Files: ${c.zone.files.length} · ${c.zone.loc} lines · ${c.zone.fanIn} importing file(s)`,
        `Imported by: ${names(c.inbound)}`,
        `Imports: ${names(c.outbound)}`,
        `Entry hints: ${c.entryHints.length ? c.entryHints.map((h) => h.file).join(', ') : 'none'}`,
      ].join('\n'));
    }
    return 0;
  }),

  visualize: guarded((root, args) => {
    const sbFile = valueOf(args, '--storyboard');
    const positional = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--storyboard');
    const json = args.includes('--json');
    const cached = args.includes('--cached');
    if (!positional[0] || (!cached && !sbFile)) {
      err('Usage: visualize "<zone>" --storyboard <file.json> [--json] | visualize "<zone>" --cached [--json]');
      return 2;
    }
    const m = buildMap(root);
    const p = pickZone(m, root, positional[0]);
    if (!p.zone) {
      err(p.why);
      return 1;
    }
    const z = p.zone;
    const rel = (path: string) => relative(root, path).split('\\').join('/');
    const ready = (path: string, scenes: string[], fromCache: boolean) => {
      if (json) out(JSON.stringify({ path, rel: rel(path), scenes, cached: fromCache }));
      else out(`Animation ready${fromCache ? ' (unchanged code, reused)' : ''}: ${rel(path)} — open it in your browser.`);
    };
    const date = new Date().toISOString();
    ensureUnderstandingIgnore(root);

    if (cached) {
      const saved = readSavedVisual(root, z.zone.id);
      let reason = saved ? '' : 'no saved animation for this zone yet';
      if (saved) {
        const fresh = checkFresh(root, { id: z.zone.id, files: z.zone.files }, saved);
        if (!fresh.fresh) reason = fresh.reason;
        else {
          try { checkStoryboard(saved.storyboard, storyboardContext(root, m, z.zone.id)); } catch { reason = 'the saved storyboard no longer matches the map'; }
        }
      }
      if (reason || !saved) {
        out(json ? JSON.stringify({ cached: false, reason }) : `No reusable animation: ${reason}.`);
        return 0;
      }
      const r = renderVisual(saved.storyboard, liveZone(z), date.slice(0, 10));
      ready(saveVisual(root, saved, r.html).html, r.scenes, true);
      return 0;
    }

    let raw: unknown;
    try {
      // Relative paths resolve against the working directory, then the repository root.
      const fromCwd = resolve(sbFile!);
      raw = JSON.parse(readFileSync(existsSync(fromCwd) ? fromCwd : resolve(root, sbFile!), 'utf8'));
    } catch (e) {
      err(`Invalid storyboard: storyboard: could not read ${sbFile} as JSON (${(e as Error).message.split('\n')[0]})`);
      return 2;
    }
    let sb;
    try {
      sb = checkStoryboard(raw, storyboardContext(root, m, z.zone.id));
    } catch (e) {
      if (!(e instanceof StoryboardError)) throw e;
      err(`Invalid storyboard: ${e.message}`);
      return 2;
    }
    const r = renderVisual(sb, liveZone(z), date.slice(0, 10));
    const paths = saveVisual(root, { zone: z.zone.id, date, fingerprint: visualFingerprint(root, z.zone.files, sb), storyboard: sb }, r.html);
    ready(paths.html, r.scenes, false);
    return 0;
  }),

  pick: guarded((root, args) => {
    const m = buildMap(root);
    const top = m.top[0];
    const unclear = m.unclearCritical[0];
    const pick = top
      ? { zone: top, why: top.reason }
      : unclear
        ? { zone: unclear, why: `${unclear.reason} · critical, but there is not enough evidence to say who understands it` }
        : { zone: null, why: 'Nothing stands out: no zone is both critical and poorly understood.' };
    out(parseArgs(args).flags.has('--json') ? JSON.stringify(pick) : pick.zone ? `${pick.zone.zone.id} — ${pick.why}` : pick.why);
    return 0;
  }),
};

export async function main(argv: string[]): Promise<number> {
  const [name, ...rest] = argv;
  const cmd = name ? commands[name] : undefined;
  if (!cmd) {
    err(`Usage: umap <${Object.keys(commands).join('|')}> [options]`);
    return 2;
  }
  return cmd(rest);
}

function isDirectRun(): boolean {
  if (!process.argv[1]) return false;
  let path = process.argv[1];
  try { path = realpathSync(path); } catch { /* compare as given */ }
  return import.meta.url === pathToFileURL(path).href;
}

if (isDirectRun()) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; });
}
