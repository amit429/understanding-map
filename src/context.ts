import { readFileSync, realpathSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { importEdges, type ImportEdge } from './imports.js';
import { buildMap, type BuildOptions } from './pipeline.js';
import { readLastLearn } from './record.js';
import type { MapResult, ZoneResult, ZoneState } from './types.js';
import { zoneIndex } from './zones.js';

const MAX_NEIGHBOURS = 8;
const MAX_FILES = 5;
const MAX_IMPORTS = 10;
const MAX_HINTS = 8;
const HINT_DEPTH = 4;
const MAX_LINE = 200;

export interface ImportLine { from: string; line: number; to: string; text: string }
/** A neighbouring zone: `files` are its files on the far side of the imports (at most 5 of `fileCount`). */
export interface Neighbour { zone: string; files: string[]; fileCount: number; imports: ImportLine[] }
export interface EntryHint { file: string; depth: number; why: string }
export type PickedBy = 'argument' | 'last-learn' | 'top-danger';

export interface ZoneContext {
  zone: { id: string; files: string[]; state: ZoneState; reason: string; loc: number; fanIn: number };
  picked: { by: PickedBy; note: string };
  inbound: Neighbour[];
  outbound: Neighbour[];
  entryHints: EntryHint[];
  fingerprint: Record<string, string>;
}
export type ContextResult = ZoneContext | { zone: null; why: string; picked?: undefined };

/** A path argument as a repository-relative path (resolved against the working directory). */
export function targetPath(root: string, target: string, cwd: string = process.cwd()): string {
  let base = cwd;
  try { base = realpathSync(base); } catch { /* keep as is */ }
  const rel = relative(root, resolve(base, target)).split('\\').join('/');
  return rel === '' ? target : rel.replace(/^\.\//, '');
}

/**
 * A zone id, a file, or a directory. A directory spanning several zones resolves to the zone holding the most files
 * under it (ties: the more dangerous, then the first id), and the note says which one was picked.
 */
export function resolveTarget(m: MapResult, root: string, target: string, cwd?: string): { zone: ZoneResult; note: string } | null {
  const byId = m.zones.find((z) => z.zone.id === target);
  if (byId) return { zone: byId, note: '' };
  const path = targetPath(root, target, cwd);
  const file = m.zones.find((z) => z.zone.files.includes(path));
  if (file) return { zone: file, note: '' };
  const dir = path.replace(/\/+$/, '') + '/';
  const counts = m.zones
    .map((z) => ({ z, n: z.zone.files.filter((f) => f.startsWith(dir)).length }))
    .filter((c) => c.n > 0)
    .sort((a, b) => b.n - a.n || b.z.danger - a.z.danger || (a.z.zone.id < b.z.zone.id ? -1 : 1));
  if (!counts.length) return null;
  const pick = counts[0];
  const note = counts.length > 1
    ? `"${target}" spans ${counts.length} zones; picked ${pick.z.zone.id}, which holds the most files under it (${pick.n}).`
    : '';
  return { zone: pick.z, note };
}

const TEST_PATH = /(^|\/)(tests?|__tests__|specs?|e2e|fixtures?|__mocks__)\/|\.(test|spec)\.[^/]+$|_test\.go$|(^|\/)test_[^/]*\.py$/;
const ENTRY_DIRS = new Set(['routes', 'route', 'router', 'controllers', 'controller', 'handlers', 'handler', 'pages', 'app', 'api',
  'cli', 'cmd', 'bin', 'server', 'endpoints', 'views']);
const ENTRY_NAMES = new Set(['main', 'index', 'server', 'app', 'cli', 'routes', 'router', 'handler', 'handlers', 'manage', 'wsgi', 'asgi']);
const MARKERS: Array<[RegExp, string]> = [
  [/\b(?:app|server|fastify|api)\.(?:get|post|put|patch|delete|route|use)\s*\(/, 'app.get('],
  [/\brouter\.\w+\s*\(/, 'router.'],
  [/@(?:Rest)?Controller\b|@(?:Request|Get|Post|Put|Delete|Patch)Mapping\b/, '@Controller'],
  [/@(?:app|router|bp|blueprint)\.(?:route|get|post|put|delete)\b/, '@app.route'],
  [/\bfunc main\s*\(/, 'func main('],
  [/if __name__ == ['"]__main__['"]/, "__name__ == '__main__'"],
  [/^#!/, 'shebang'],
];

/** Why a file looks like an entry point (route, handler, page, CLI or main), or null. Tests never are. */
export function entryHint(path: string, source: string | null): string | null {
  if (TEST_PATH.test(path)) return null;
  const segs = path.split('/');
  const name = segs[segs.length - 1];
  const inPagesOrApp = segs.slice(0, -1).some((s) => s === 'pages' || s === 'app');
  if (source !== null) {
    for (const [re, label] of MARKERS) if (re.test(source)) return `marker: ${label}`;
    if (inPagesOrApp && /\bexport default (?:async )?function\b/.test(source)) return 'marker: export default function';
  }
  const dir = segs.slice(0, -1).find((s) => ENTRY_DIRS.has(s));
  if (dir) return `path: ${dir}/`;
  const stem = name.replace(/\.[^.]+$/, '');
  if (ENTRY_NAMES.has(stem)) return `name: ${name}`;
  return null;
}

function readLines(root: string, path: string, cache: Map<string, string[] | null>): string[] | null {
  if (!cache.has(path)) {
    try { cache.set(path, readFileSync(join(root, path), 'utf8').split('\n')); } catch { cache.set(path, null); }
  }
  return cache.get(path)!;
}

const byCountThenName = <T extends { n: number; key: string }>(a: T, b: T) => b.n - a.n || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);

function neighbours(
  edges: ImportEdge[], zoneOf: Map<string, string>, side: 'importer' | 'imported', root: string, lines: Map<string, string[] | null>,
): Neighbour[] {
  // side 'importer': the neighbour holds the importing file; 'imported': it holds the imported file.
  const groups = new Map<string, Map<string, ImportEdge[]>>();
  for (const e of edges) {
    const file = side === 'importer' ? e.fromFile : e.toFile;
    const z = zoneOf.get(file);
    if (!z) continue;
    const g = groups.get(z) ?? groups.set(z, new Map()).get(z)!;
    (g.get(file) ?? g.set(file, []).get(file)!).push(e);
  }
  return [...groups.entries()]
    .map(([zone, files]) => ({ zone, files, n: files.size, key: zone }))
    .sort(byCountThenName)
    .slice(0, MAX_NEIGHBOURS)
    .map(({ zone, files }) => {
      const top = [...files.entries()].map(([f, es]) => ({ f, es, n: es.length, key: f })).sort(byCountThenName).slice(0, MAX_FILES);
      const imports = top.flatMap((t) => t.es)
        .sort((a, b) => (a.fromFile < b.fromFile ? -1 : a.fromFile > b.fromFile ? 1 : a.line - b.line))
        .slice(0, MAX_IMPORTS)
        .map((e) => ({
          from: e.fromFile, line: e.line, to: e.toFile,
          text: (readLines(root, e.fromFile, lines)?.[e.line - 1] ?? '').trim().slice(0, MAX_LINE),
        }));
      return { zone, files: top.map((t) => t.f).sort(), fileCount: files.size, imports };
    });
}

function entryHints(root: string, zoneFiles: string[], edges: ImportEdge[], lines: Map<string, string[] | null>): EntryHint[] {
  const importersOf = new Map<string, string[]>();
  for (const e of edges) (importersOf.get(e.toFile) ?? importersOf.set(e.toFile, []).get(e.toFile)!).push(e.fromFile);
  const depth = new Map<string, number>(zoneFiles.map((f) => [f, 0]));
  let frontier = [...zoneFiles];
  for (let d = 1; d <= HINT_DEPTH && frontier.length; d++) {
    const next: string[] = [];
    for (const f of frontier) {
      for (const imp of importersOf.get(f) ?? []) {
        if (depth.has(imp)) continue;
        depth.set(imp, d);
        next.push(imp);
      }
    }
    frontier = next;
  }
  const hints: EntryHint[] = [];
  for (const [file, d] of depth) {
    const why = entryHint(file, readLines(root, file, lines)?.join('\n') ?? null);
    if (why) hints.push({ file, depth: d, why });
  }
  return hints.sort((a, b) => a.depth - b.depth || (a.file < b.file ? -1 : 1)).slice(0, MAX_HINTS);
}

/** The deterministic context for one zone: its neighbours across the import graph and likely entry points. */
export function zoneContext(root: string, m: MapResult, z: ZoneResult, picked: ZoneContext['picked']): ZoneContext {
  const zoneOf = zoneIndex(m.zones.map((r) => r.zone));
  const edges = importEdges(root, [...zoneOf.keys()]);
  const mine = new Set(z.zone.files);
  const inEdges = edges.filter((e) => mine.has(e.toFile) && !mine.has(e.fromFile));
  const outEdges = edges.filter((e) => mine.has(e.fromFile) && !mine.has(e.toFile));
  const lines = new Map<string, string[] | null>();
  return {
    zone: { id: z.zone.id, files: z.zone.files, state: z.state, reason: z.reason, loc: z.zone.loc, fanIn: z.criticality.fanIn },
    picked,
    inbound: neighbours(inEdges, zoneOf, 'importer', root, lines),
    outbound: neighbours(outEdges, zoneOf, 'imported', root, lines),
    entryHints: entryHints(root, z.zone.files, edges, lines),
    fingerprint: z.zone.fingerprint,
  };
}

/** The zone named by `target`; with none, the last learn session's zone, then the top danger zone (as `pick`). */
export function pickZone(m: MapResult, root: string, target: string | undefined, cwd?: string):
  { zone: ZoneResult; picked: ZoneContext['picked'] } | { zone: null; why: string } {
  if (target) {
    const r = resolveTarget(m, root, target, cwd);
    return r ? { zone: r.zone, picked: { by: 'argument', note: r.note || r.zone.reason } } : { zone: null, why: `No zone found for "${target}".` };
  }
  const last = readLastLearn(root);
  const lastZone = last && m.zones.find((z) => z.zone.id === last.zone);
  if (lastZone) return { zone: lastZone, picked: { by: 'last-learn', note: `the zone of your last learning session · ${lastZone.reason}` } };
  const top = m.top[0] ?? m.unclearCritical[0];
  if (top) return { zone: top, picked: { by: 'top-danger', note: top.reason } };
  return { zone: null, why: 'Nothing stands out: no zone is both critical and poorly understood. Name a zone or path.' };
}

export function buildContext(root: string, target: string | undefined, opts: BuildOptions & { cwd?: string } = {}): ContextResult {
  const m = buildMap(root, opts);
  const p = pickZone(m, root, target, opts.cwd);
  return p.zone ? zoneContext(root, m, p.zone, p.picked) : p;
}
