import { readFileSync } from 'node:fs';
import { join, posix } from 'node:path';
import type { Commit, FileEntry, Zone } from './types.js';
import { zoneIndex } from './zones.js';

export type Lang = 'ts' | 'py' | 'go' | 'java' | 'rs' | 'rb' | 'php' | 'cs';

const EXT_LANG: Record<string, Lang> = {
  ts: 'ts', tsx: 'ts', mts: 'ts', cts: 'ts', js: 'ts', jsx: 'ts', mjs: 'ts', cjs: 'ts',
  py: 'py', go: 'go', java: 'java', kt: 'java', rs: 'rs', rb: 'rb', php: 'php', cs: 'cs',
};

export function languageOf(path: string): Lang | null {
  const dot = path.lastIndexOf('.');
  return dot < 0 ? null : EXT_LANG[path.slice(dot + 1).toLowerCase()] ?? null;
}

/** One regex set per language; capture group 1 is the import specifier. */
const PATTERNS: Record<Lang, RegExp[]> = {
  ts: [
    /\b(?:import|export)\s[^'"`;]*?\bfrom\s*['"]([^'"]+)['"]/g,
    /\bimport\s*['"]([^'"]+)['"]/g,
    /\b(?:require|import)\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ],
  py: [/^[ \t]*from\s+(\.*[\w.]*)\s+import\b/gm, /^[ \t]*import\s+([\w.]+)/gm],
  go: [/\bimport\s+(?:[\w.]+\s+)?"([^"]+)"/g, /^[ \t]*(?:[\w.]+\s+)?"([^"\n]+)"[ \t]*$/gm],
  java: [/^[ \t]*import\s+(?:static\s+)?([\w.]*\w(?:\.\*)?)\s*;?/gm],
  cs: [/^[ \t]*using\s+(?:static\s+)?([\w.]+)\s*;/gm],
  rs: [/^[ \t]*(?:pub\s+)?use\s+((?:crate|self|super)(?:::\w+)*)/gm, /^[ \t]*(?:pub\s+)?mod\s+(\w+)\s*;/gm],
  rb: [/^[ \t]*require_relative\s*\(?\s*['"]([^'"]+)['"]/gm, /^[ \t]*require\s*\(?\s*['"]([^'"]+)['"]/gm],
  php: [
    /\b(?:require|include)(?:_once)?\s*\(?\s*(?:__DIR__\s*\.\s*)?['"]([^'"]+)['"]/g,
    /^[ \t]*use\s+(?:function\s+|const\s+)?([\w\\]+)/gm,
  ],
};

export function extractImports(lang: Lang, source: string): string[] {
  if (lang === 'go') {
    // Go grouped imports: only treat quoted lines inside `import ( ... )` as imports.
    const blocks = [...source.matchAll(/\bimport\s*\(([\s\S]*?)\)/g)].map((m) => m[1]);
    const single = [...source.matchAll(PATTERNS.go[0])].map((m) => m[1]);
    const grouped = blocks.flatMap((b) => [...b.matchAll(PATTERNS.go[1])].map((m) => m[1]));
    return [...new Set([...single, ...grouped])];
  }
  if (lang === 'rs') {
    const out: string[] = [];
    for (const m of source.matchAll(PATTERNS.rs[0])) out.push(m[1]);
    for (const m of source.matchAll(PATTERNS.rs[1])) out.push(`self::${m[1]}`);
    return [...new Set(out)];
  }
  const out = new Set<string>();
  for (const re of PATTERNS[lang]) for (const m of source.matchAll(re)) out.add(m[1]);
  return [...out];
}

interface Index { dirs: Set<string>; list: string[] }
const indexCache = new WeakMap<Set<string>, Index>();
function indexOf(files: Set<string>): Index {
  let ix = indexCache.get(files);
  if (!ix) {
    const dirs = new Set<string>();
    for (const f of files) {
      let d = posix.dirname(f);
      while (d !== '.' && !dirs.has(d)) { dirs.add(d); d = posix.dirname(d); }
    }
    ix = { dirs, list: [...files].sort() };
    indexCache.set(files, ix);
  }
  return ix;
}

const dirOf = (p: string) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '');
const joinPath = (...parts: string[]) => posix.normalize(parts.filter(Boolean).join('/')).replace(/^\.\//, '');
const endsAt = (path: string, suffix: string) => path === suffix || path.endsWith(`/${suffix}`);

/** Longest trailing-segment match of `segs` against a real directory; null if fewer than `min` segments match. */
function dirBySuffix(segs: string[], files: Set<string>, min: number): string | null {
  const { dirs } = indexOf(files);
  for (let k = segs.length; k >= Math.min(min, segs.length); k--) {
    const suffix = segs.slice(segs.length - k).join('/');
    const hit = [...dirs].sort().find((d) => endsAt(d, suffix));
    if (hit) return hit;
  }
  return null;
}

function fileBySuffix(rel: string, exts: string[], files: Set<string>): string | null {
  const { list } = indexOf(files);
  for (const e of exts) {
    const hit = list.find((f) => endsAt(f, rel + e));
    if (hit) return hit;
  }
  return null;
}

const firstIn = (cands: string[], files: Set<string>) => cands.find((c) => files.has(c)) ?? null;
const TS_EXTS = ['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs'];

/** Go module paths keyed by the directory holding their go.mod ('' for the repo root). */
export type GoModules = Map<string, string>;

function resolveGo(from: string, spec: string, files: Set<string>, modules: GoModules): string | null {
  let modDir: string | null = null;
  for (let d = dirOf(from); modDir === null; d = dirOf(d)) {
    if (modules.has(d)) modDir = d;
    if (!d) break;
  }
  if (modDir !== null) {
    const mod = modules.get(modDir)!;
    if (spec !== mod && !spec.startsWith(`${mod}/`)) return null; // stdlib or third-party
    const target = joinPath(modDir, spec.slice(mod.length + 1));
    return indexOf(files).dirs.has(target) ? target : null;
  }
  const segs = spec.split('/').filter(Boolean);
  return segs.length < 2 ? null : dirBySuffix(segs, files, 2);
}

export function resolveImport(
  from: string, spec: string, lang: Lang, files: Set<string>, goModules: GoModules = new Map(),
): string | null {
  const dir = dirOf(from);
  switch (lang) {
    case 'ts': {
      if (!spec.startsWith('.')) return null;
      const base = joinPath(dir, spec);
      const stem = base.replace(/\.(?:[cm]?js|jsx)$/, '');
      return firstIn([
        base, ...TS_EXTS.map((e) => base + e), ...TS_EXTS.map((e) => stem + e),
        ...TS_EXTS.map((e) => `${base}/index${e}`),
      ], files);
    }
    case 'py': {
      const dots = spec.match(/^\.*/)![0].length;
      const parts = spec.slice(dots).split('.').filter(Boolean);
      const tryBase = (base: string) => firstIn([`${base}.py`, `${base}/__init__.py`].map((c) => c.replace(/^\//, '')), files);
      if (dots > 0) {
        let d = dir;
        for (let i = 1; i < dots; i++) d = dirOf(d);
        return tryBase(joinPath(d, ...parts));
      }
      if (!parts.length) return null;
      for (let d = dir; ; d = dirOf(d)) {
        const hit = tryBase(joinPath(d, ...parts));
        if (hit) return hit;
        if (!d) return null;
      }
    }
    case 'go':
      return resolveGo(from, spec, files, goModules);
    case 'cs': {
      const segs = spec.split('.').filter(Boolean);
      return dirBySuffix(segs, files, segs.length === 1 ? 1 : 2);
    }
    case 'java': {
      const wild = spec.endsWith('.*');
      const segs = spec.replace(/\.\*$/, '').split('.');
      if (!wild) {
        for (let k = segs.length; k >= 2; k--) { // trailing segments may be a nested class or static member
          const hit = fileBySuffix(segs.slice(0, k).join('/'), ['.java', '.kt'], files);
          if (hit) return hit;
        }
      }
      return dirBySuffix(wild ? segs : segs.slice(0, -1), files, 2);
    }
    case 'rs': {
      const [head, ...rest] = spec.split('::');
      if (head === 'super') return null;
      if (head === 'self') {
        const name = rest[0];
        const stem = posix.basename(from).replace(/\.rs$/, '');
        const nest = ['mod', 'lib', 'main'].includes(stem) ? dir : joinPath(dir, stem);
        return firstIn([joinPath(nest, `${name}.rs`), joinPath(nest, name, 'mod.rs')], files);
      }
      for (let k = rest.length; k >= 1; k--) {
        const rel = rest.slice(0, k).join('/');
        const hit = fileBySuffix(rel, ['.rs', '/mod.rs'], files);
        if (hit) return hit;
        const d = dirBySuffix(rest.slice(0, k), files, k);
        if (d && endsAt(d, rel)) return d;
      }
      return null;
    }
    case 'rb': {
      const rel = spec.replace(/\.rb$/, '');
      const local = joinPath(dir, `${rel}.rb`);
      if (files.has(local)) return local;
      return fileBySuffix(rel.replace(/^(\.\.?\/)+/, ''), ['.rb'], files);
    }
    case 'php': {
      if (spec.includes('\\')) return fileBySuffix(spec.replace(/^\\/, '').replace(/\\/g, '/'), ['.php'], files);
      const rel = spec.replace(/^\//, '');
      return firstIn([joinPath(dir, rel), rel], files);
    }
  }
}

const MIN_COCHANGE_COMMITS = 3;

function readSource(root: string, path: string): string | null {
  try {
    return readFileSync(join(root, path), 'utf8');
  } catch {
    return null;
  }
}

export function fanInByZone(root: string, files: FileEntry[], zones: Zone[], commits: Commit[]): Record<string, number> {
  const known = new Set(files.map((f) => f.path));
  const zoneOf = zoneIndex(zones);
  const importers = new Map<string, Set<string>>(zones.map((z) => [z.id, new Set<string>()]));
  const filesByDir = new Map<string, Set<string>>();
  for (const p of known) {
    for (let d = dirOf(p); ; d = dirOf(d)) {
      (filesByDir.get(d) ?? filesByDir.set(d, new Set()).get(d)!).add(p);
      if (!d) break;
    }
  }

  const goModules: GoModules = new Map();
  for (const p of known) {
    if (posix.basename(p) !== 'go.mod') continue;
    const m = readSource(root, p)?.match(/^\s*module\s+(\S+)/m);
    if (m) goModules.set(dirOf(p), m[1].replace(/^"|"$/g, ''));
  }

  const hasSupported = new Set<string>();
  for (const [path, zid] of zoneOf) {
    const lang = languageOf(path);
    if (!lang || !known.has(path)) continue;
    hasSupported.add(zid);
    const src = readSource(root, path);
    if (src === null) continue;
    for (const spec of extractImports(lang, src)) {
      const target = resolveImport(path, spec, lang, known, goModules);
      if (!target) continue;
      const targets = known.has(target) ? [target] : [...(filesByDir.get(target) ?? [])];
      for (const t of targets) {
        const tz = zoneOf.get(t);
        if (tz && tz !== zid) importers.get(tz)!.add(path);
      }
    }
  }

  const result: Record<string, number> = {};
  for (const z of zones) {
    if (hasSupported.has(z.id)) {
      result[z.id] = importers.get(z.id)!.size;
      continue;
    }
    const counts = new Map<string, number>();
    for (const c of commits) {
      const paths = new Set(c.files.map((f) => f.path));
      if (!z.files.some((f) => paths.has(f))) continue;
      for (const p of paths) {
        const pz = zoneOf.get(p);
        if (pz && pz !== z.id) counts.set(p, (counts.get(p) ?? 0) + 1);
      }
    }
    result[z.id] = [...counts.values()].filter((n) => n >= MIN_COCHANGE_COMMITS).length;
  }
  return result;
}
