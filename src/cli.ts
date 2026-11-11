import { realpathSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isSetUp, loadConfig } from './config.js';
import { repoRootOf } from './git.js';
import { buildMap } from './pipeline.js';
import { formatSummary, formatWho } from './terminal.js';
import type { MapResult, ZoneResult } from './types.js';

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

export const commands: Record<string, Command> = {
  status: guarded((root, args) => {
    const setUp = isSetUp(root);
    const mode = loadConfig(root).mode;
    if (parseArgs(args).flags.has('--json')) out(JSON.stringify({ setUp, mode, root }));
    else out(setUp ? `Understanding Map is set up (${mode} mode) in ${root}` : 'Understanding Map is not set up yet. Run /understanding-map:setup.');
    return 0;
  }),

  map: guarded((root, args) => {
    const m = buildMap(root);
    if (parseArgs(args).flags.has('--json')) {
      out(JSON.stringify(m));
      return 0;
    }
    let text = formatSummary(m, null);
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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; });
}
