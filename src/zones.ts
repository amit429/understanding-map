import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import picomatch from 'picomatch';
import { umDir } from './config.js';
import type { Config, FileEntry, Zone } from './types.js';

export const DEFAULT_EXCLUDES = [
  '**/node_modules/**', '**/dist/**', '**/build/**', '**/vendor/**', '**/*.min.*', '**/*.map', '**/*.snap',
  '**/*.lock', '**/package-lock.json', '**/pnpm-lock.yaml', '**/go.sum', '.understanding/**',
];

const MAX_FILE_BYTES = 1024 * 1024;
const SPLIT_ABOVE = 3000;
const MERGE_BELOW = 150;
const ROOT_ID = '(root)';

/** Matches paths left off the map: DEFAULT_EXCLUDES plus config.exclude. */
export function excludeMatcher(exclude: string[]): (path: string) => boolean {
  return picomatch([...DEFAULT_EXCLUDES, ...exclude], { dot: true });
}

export function readFileEntries(root: string, paths: string[], exclude: string[]): FileEntry[] {
  const isExcluded = excludeMatcher(exclude);
  const out: FileEntry[] = [];
  for (const path of paths) {
    if (isExcluded(path)) continue;
    const full = join(root, path);
    let buf: Buffer;
    try {
      const st = statSync(full);
      if (!st.isFile() || st.size > MAX_FILE_BYTES) continue;
      buf = readFileSync(full);
    } catch {
      continue; // tracked but missing or unreadable
    }
    if (buf.includes(0)) continue; // binary
    const loc = buf.toString('utf8').split('\n').filter((l) => l.trim() !== '').length;
    out.push({ path, loc, hash: createHash('sha1').update(buf).digest('hex').slice(0, 12) });
  }
  return out;
}

interface Draft {
  id: string;
  dir: string;
  override: boolean;
  files: FileEntry[];
}

const dirOf = (path: string) => (path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '');
const parentOf = (dir: string) => dirOf(dir);
const idForDir = (dir: string) => dir || ROOT_ID;
const sumLoc = (files: FileEntry[]) => files.reduce((n, f) => n + f.loc, 0);
const byPath = (a: FileEntry, b: FileEntry) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0);

/** Splits path-sorted files into balanced chunks of at most SPLIT_ABOVE lines each. */
function chunk(files: FileEntry[]): FileEntry[][] {
  const target = sumLoc(files) / Math.ceil(sumLoc(files) / SPLIT_ABOVE);
  const chunks: FileEntry[][] = [];
  let cur: FileEntry[] = [];
  let curLoc = 0;
  for (const f of files) {
    if (cur.length && (curLoc + f.loc > SPLIT_ABOVE || curLoc >= target)) {
      chunks.push(cur);
      cur = [];
      curLoc = 0;
    }
    cur.push(f);
    curLoc += f.loc;
  }
  if (cur.length) chunks.push(cur);
  return chunks;
}

function zoneDirectories(files: FileEntry[]): Draft[] {
  const byDir = new Map<string, FileEntry[]>();
  for (const f of files) {
    const dir = dirOf(f.path);
    (byDir.get(dir) ?? byDir.set(dir, []).get(dir)!).push(f);
  }
  const out: Draft[] = [];
  for (const [dir, direct] of byDir) {
    if (sumLoc(direct) <= SPLIT_ABOVE) {
      out.push({ id: idForDir(dir), dir, override: false, files: direct });
      continue;
    }
    const chunks = chunk(direct);
    chunks.forEach((c, i) =>
      out.push({ id: chunks.length === 1 ? idForDir(dir) : `${idForDir(dir)}#${i + 1}`, dir, override: false, files: c }));
  }
  return out;
}

function mergeSmall(drafts: Draft[]): Draft[] {
  const zones = [...drafts];
  for (;;) {
    const small = zones
      .filter((z) => !z.override && z.dir !== '' && sumLoc(z.files) < MERGE_BELOW)
      .sort((a, b) => b.dir.split('/').length - a.dir.split('/').length || (a.id < b.id ? -1 : 1))[0];
    if (!small) return zones;
    zones.splice(zones.indexOf(small), 1);
    const parent = parentOf(small.dir);
    let target = zones.find((z) => !z.override && z.dir === parent && !z.id.includes('#'));
    if (!target) {
      target = { id: idForDir(parent), dir: parent, override: false, files: [] };
      zones.push(target);
    }
    target.files.push(...small.files);
  }
}

export function buildZones(files: FileEntry[], config: Config): Zone[] {
  const drafts: Draft[] = [];
  const claimed = new Set<string>();
  for (const [name, patterns] of Object.entries(config.zones)) {
    const match = picomatch(patterns, { dot: true });
    const mine = files.filter((f) => !claimed.has(f.path) && match(f.path));
    mine.forEach((f) => claimed.add(f.path));
    if (mine.length) drafts.push({ id: name, dir: '', override: true, files: mine });
  }

  const rest = files.filter((f) => !claimed.has(f.path));
  const dirZones = zoneDirectories(rest.sort(byPath));

  return [...drafts, ...mergeSmall(dirZones)]
    .map((d) => {
      const sorted = [...d.files].sort(byPath);
      return {
        id: d.id,
        files: sorted.map((f) => f.path),
        loc: sumLoc(sorted),
        fingerprint: Object.fromEntries(sorted.map((f) => [f.path, f.hash])),
      };
    })
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

export function zoneIndex(zones: Zone[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const z of zones) for (const f of z.files) m.set(f, z.id);
  return m;
}

function cachePath(root: string): string {
  return join(umDir(root), 'local', 'zones-cache.json');
}

export function writeZoneCache(root: string, zones: Zone[]): void {
  const path = cachePath(root);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(Object.fromEntries(zoneIndex(zones))));
}

export function readZoneCache(root: string): Record<string, string> | null {
  try {
    const v: unknown = JSON.parse(readFileSync(cachePath(root), 'utf8'));
    return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, string>) : null;
  } catch {
    return null;
  }
}
