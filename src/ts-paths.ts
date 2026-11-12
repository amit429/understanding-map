import { readFileSync } from 'node:fs';
import { join, posix } from 'node:path';

/**
 * TypeScript / JavaScript path aliases (`compilerOptions.paths` and `baseUrl` in tsconfig*.json or jsconfig.json),
 * so imports like `@/app/services/auth.service` count in the import graph. Resolution follows tsc's rules closely
 * enough for fan-in: the nearest config directory above the importing file wins; within a pattern list the longest
 * matching prefix wins; targets are relative to `baseUrl` when it is set, otherwise to the config's directory.
 */
export interface TsPathConfig {
  /** Repository-relative directory of the config file ('' for the root). */
  dir: string;
  /** Repository-relative directory that bare imports and path targets resolve against, or null. */
  baseUrl: string | null;
  /** Repository-relative directory that path targets resolve against. */
  pathsBase: string;
  paths: Array<[pattern: string, targets: string[]]>;
}
/** Configs by directory, deepest first. */
export type TsPaths = TsPathConfig[];

const CONFIG_RE = /^(?:tsconfig(?:\.[\w-]+)?|jsconfig)\.json$/;
const MAX_EXTENDS = 5;

const dirOf = (p: string) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '');
const norm = (...parts: string[]) => {
  const j = posix.normalize(parts.filter(Boolean).join('/')).replace(/^\.\//, '').replace(/\/+$/, '');
  return j === '.' ? '' : j;
};

/** JSON with comments and trailing commas (the tsconfig dialect). Returns null when it can't be parsed. */
export function parseJsonc(text: string): unknown {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      let j = i + 1;
      while (j < text.length && text[j] !== '"') j += text[j] === '\\' ? 2 : 1;
      out += text.slice(i, j + 1);
      i = j;
    } else if (c === '/' && text[i + 1] === '/') {
      while (i < text.length && text[i] !== '\n') i++;
      out += '\n';
    } else if (c === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2);
      i = end < 0 ? text.length : end + 1;
    } else {
      out += c;
    }
  }
  try {
    return JSON.parse(out.replace(/,(\s*[}\]])/g, '$1'));
  } catch {
    return null;
  }
}

interface RawOptions { baseUrl?: string; paths?: Record<string, string[]>; baseDir: string; pathsDir: string }

function readOptions(root: string, path: string, known: Set<string>, depth = 0): RawOptions | null {
  let raw: unknown;
  try {
    raw = parseJsonc(readFileSync(join(root, path), 'utf8'));
  } catch {
    return null;
  }
  if (!raw || typeof raw !== 'object') return null;
  const cfg = raw as { extends?: unknown; compilerOptions?: { baseUrl?: unknown; paths?: unknown } };
  const dir = dirOf(path);
  let inherited: RawOptions | null = null;
  // Only relative extends inside the repository; package presets (@tsconfig/...) carry no project paths.
  if (typeof cfg.extends === 'string' && cfg.extends.startsWith('.') && depth < MAX_EXTENDS) {
    let parent = norm(dir, cfg.extends);
    if (!parent.endsWith('.json')) parent += '.json';
    if (known.has(parent) || depth === 0) inherited = readOptions(root, parent, known, depth + 1);
  }
  const opts = cfg.compilerOptions ?? {};
  const own: RawOptions = { ...(inherited ?? { baseDir: dir, pathsDir: dir }) };
  if (typeof opts.baseUrl === 'string') {
    own.baseUrl = opts.baseUrl;
    own.baseDir = dir;
  }
  if (opts.paths && typeof opts.paths === 'object' && !Array.isArray(opts.paths)) {
    const paths: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(opts.paths as Record<string, unknown>)) {
      if (Array.isArray(v)) paths[k] = v.filter((t): t is string => typeof t === 'string');
    }
    own.paths = paths;
    own.pathsDir = dir;
  }
  return own;
}

/** Reads every tsconfig*.json / jsconfig.json among the known files that defines `paths` or `baseUrl`. */
export function loadTsPaths(root: string, known: Set<string>): TsPaths {
  const byDir = new Map<string, TsPathConfig>();
  for (const p of [...known].sort()) {
    if (!CONFIG_RE.test(posix.basename(p))) continue;
    const o = readOptions(root, p, known);
    if (!o || (!o.paths && o.baseUrl === undefined)) continue;
    const dir = dirOf(p);
    const baseUrl = o.baseUrl === undefined ? null : norm(o.baseDir, o.baseUrl);
    const cfg: TsPathConfig = {
      dir,
      baseUrl,
      pathsBase: baseUrl ?? o.pathsDir,
      paths: Object.entries(o.paths ?? {}),
    };
    const prev = byDir.get(dir);
    if (!prev) byDir.set(dir, cfg);
    else {
      // Several configs in one folder (tsconfig.json + tsconfig.app.json): merge, first one's entries first.
      const seen = new Set(prev.paths.map(([k]) => k));
      prev.paths.push(...cfg.paths.filter(([k]) => !seen.has(k)));
      prev.baseUrl ??= cfg.baseUrl;
    }
  }
  return [...byDir.values()].sort((a, b) => b.dir.length - a.dir.length);
}

const inside = (file: string, dir: string) => dir === '' || file === dir || file.startsWith(`${dir}/`);

/**
 * Candidate base paths (without extension) for a non-relative specifier, in tsc's order: matching `paths` patterns
 * (longest prefix first, each target in order), then `baseUrl`. Empty when no config applies.
 */
export function aliasCandidates(from: string, spec: string, tsPaths: TsPaths): string[] {
  if (spec.startsWith('.') || spec.startsWith('/')) return [];
  const cfg = tsPaths.find((c) => inside(from, c.dir));
  if (!cfg) return [];
  const matches: Array<{ prefixLen: number; targets: string[]; star: string }> = [];
  for (const [pattern, targets] of cfg.paths) {
    const star = pattern.indexOf('*');
    if (star < 0) {
      if (pattern === spec) matches.push({ prefixLen: pattern.length, targets, star: '' });
      continue;
    }
    const pre = pattern.slice(0, star);
    const post = pattern.slice(star + 1);
    if (spec.length >= pre.length + post.length && spec.startsWith(pre) && spec.endsWith(post)) {
      matches.push({ prefixLen: pre.length, targets, star: spec.slice(pre.length, spec.length - post.length) });
    }
  }
  matches.sort((a, b) => b.prefixLen - a.prefixLen);
  const out: string[] = [];
  for (const m of matches) for (const t of m.targets) out.push(norm(cfg.pathsBase, t.replace('*', m.star)));
  if (cfg.baseUrl !== null) out.push(norm(cfg.baseUrl, spec));
  return out;
}
