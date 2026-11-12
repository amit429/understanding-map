import { realpathSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ensureUnderstandingIgnore, isSetUp, loadConfig } from './config.js';
import { repoRootOf } from './git.js';
import { onPostToolUse, onStop } from './hooks.js';
import { buildMap } from './pipeline.js';
import { ghAvailable, readReviewCache, reviewCountsByPath, type PathCounts } from './reviews.js';
import { renderReport, writeReport } from './report.js';
import { handoffSet, markUnverifiable, recordResult, skipHandoff, type Grade } from './record.js';
import { runSetup } from './setup.js';
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
  let cwd = process.cwd();
  try { cwd = realpathSync(cwd); } catch { /* keep as is */ }
  const rel = relative(root, resolve(cwd, target)).split('\\').join('/');
  const path = rel === '' ? target : rel.replace(/^\.\//, '');
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
    const critical = (valueOf('--critical') ?? '').split(',').map((g) => g.trim()).filter(Boolean);
    const r = runSetup(root, { mode, critical });
    const lines = [
      `Set up Understanding Map in ${mode} mode.`,
      `Wrote ${relative(root, r.configPath)}${critical.length ? ` with critical areas: ${critical.join(', ')}` : ''}.`,
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
        reportPath = writeReport(root, renderReport(m, config));
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
