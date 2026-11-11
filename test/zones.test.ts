import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, umDir } from '../src/config';
import type { Config, FileEntry } from '../src/types';
import { buildZones, readFileEntries, readZoneCache, writeZoneCache, zoneIndex } from '../src/zones';

const dirs: string[] = [];
function tmp(): string {
  const d = mkdtempSync(join(tmpdir(), 'umap-zones-'));
  dirs.push(d);
  return d;
}
afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});
function put(root: string, path: string, content: string | Buffer): void {
  const full = join(root, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}
const lines = (n: number) => Array.from({ length: n }, (_, i) => `line ${i}`).join('\n');
const cfg = (over: Partial<Config> = {}): Config => ({ ...structuredClone(DEFAULT_CONFIG), ...over });
const fe = (path: string, loc: number): FileEntry => ({ path, loc, hash: `h-${path}` });

describe('readFileEntries', () => {
  it('excludes lockfiles, minified, dist, binary and >1MB files', () => {
    const root = tmp();
    const paths = ['src/a.ts', 'package-lock.json', 'yarn.lock', 'app.min.js', 'dist/x.js', 'bin.dat', 'big.txt', 'vendor/v.js', 'custom/skip.ts'];
    put(root, 'src/a.ts', 'one\ntwo\n');
    put(root, 'package-lock.json', '{}');
    put(root, 'yarn.lock', 'x');
    put(root, 'app.min.js', 'x');
    put(root, 'dist/x.js', 'x');
    put(root, 'bin.dat', Buffer.from([65, 0, 66]));
    put(root, 'big.txt', 'a\n'.repeat(600_000));
    put(root, 'vendor/v.js', 'x');
    put(root, 'custom/skip.ts', 'x');
    const out = readFileEntries(root, paths, ['custom/**']);
    expect(out.map((f) => f.path)).toEqual(['src/a.ts']);
  });

  it('counts non-empty lines', () => {
    const root = tmp();
    put(root, 'a.ts', 'a\n\n  \nb\n\nc');
    expect(readFileEntries(root, ['a.ts'], [])[0].loc).toBe(3);
  });

  it('hash is stable for identical content and changes with content', () => {
    const root = tmp();
    put(root, 'a.ts', 'same');
    put(root, 'b.ts', 'same');
    const [a1, b1] = readFileEntries(root, ['a.ts', 'b.ts'], []);
    expect(a1.hash).toBe(b1.hash);
    expect(a1.hash).toMatch(/^[0-9a-f]{12}$/);
    put(root, 'a.ts', 'different');
    expect(readFileEntries(root, ['a.ts'], [])[0].hash).not.toBe(a1.hash);
  });
});

describe('buildZones', () => {
  it('splits a 4000-line directory across subdirectories', () => {
    const zones = buildZones([fe('dir/a/x.ts', 2000), fe('dir/b/y.ts', 2000)], cfg());
    expect(zones.map((z) => z.id)).toEqual(['dir/a', 'dir/b']);
  });

  it('chunks a flat 7000-line directory alphabetically', () => {
    const files = Array.from({ length: 70 }, (_, i) => fe(`dir/f${String(i).padStart(2, '0')}.ts`, 100));
    const zones = buildZones([...files].reverse(), cfg());
    expect(zones.map((z) => z.id)).toEqual(['dir#1', 'dir#2', 'dir#3']);
    for (const z of zones) expect(z.loc).toBeLessThanOrEqual(3000);
    expect(zones.flatMap((z) => z.files)).toEqual(files.map((f) => f.path));
  });

  it('merges a 100-line directory into its parent', () => {
    const zones = buildZones(
      [fe('src/big/a.ts', 3500), fe('src/index.ts', 200), fe('src/tiny/t.ts', 100)],
      cfg(),
    );
    expect(zones.map((z) => z.id)).toEqual(['src', 'src/big']);
    expect(zones.find((z) => z.id === 'src')!.files).toEqual(['src/index.ts', 'src/tiny/t.ts']);
  });

  it('keeps a small repo as a single zone', () => {
    expect(buildZones([fe('a.ts', 500), fe('src/b.ts', 500)], cfg()).map((z) => z.id)).toEqual(['(root)']);
  });

  it('creates the parent zone when it has no files of its own', () => {
    const zones = buildZones([fe('src/big/a.ts', 3500), fe('src/tiny/t.ts', 100)], cfg());
    expect(zones.map((z) => z.id)).toEqual(['(root)', 'src/big']);
  });

  it('puts root-level files in (root)', () => {
    const zones = buildZones([fe('a.ts', 500), fe('b.ts', 500)], cfg());
    expect(zones.map((z) => z.id)).toEqual(['(root)']);
    expect(zones[0].files).toEqual(['a.ts', 'b.ts']);
  });

  it('claims override files before directory zoning', () => {
    const files = [fe('src/pay/a.ts', 400), fe('src/billing/stripe.ts', 300), fe('src/billing/other.ts', 300), fe('lib/big.ts', 3500)];
    const zones = buildZones(files, cfg({ zones: { payments: ['src/pay/**', 'src/billing/stripe*.ts'] } }));
    const pay = zones.find((z) => z.id === 'payments')!;
    expect(pay.files).toEqual(['src/billing/stripe.ts', 'src/pay/a.ts']);
    expect(pay.loc).toBe(700);
    expect(zones.find((z) => z.id === 'src')!.files).toEqual(['src/billing/other.ts']);
    expect(zones.map((z) => z.id)).toEqual(['lib', 'payments', 'src']);
  });

  it('never merges an override zone, even when small', () => {
    const zones = buildZones([fe('src/pay/a.ts', 10), fe('src/x.ts', 500), fe('lib/big.ts', 3500)], cfg({ zones: { payments: ['src/pay/**'] } }));
    expect(zones.map((z) => z.id)).toEqual(['lib', 'payments', 'src']);
  });

  it('fingerprint maps each file to its hash', () => {
    const zones = buildZones([fe('a.ts', 500), fe('b.ts', 500)], cfg());
    expect(zones[0].fingerprint).toEqual({ 'a.ts': 'h-a.ts', 'b.ts': 'h-b.ts' });
  });
});

describe('zone cache', () => {
  it('round-trips path to zone id and returns null when absent', () => {
    const root = tmp();
    expect(readZoneCache(root)).toBeNull();
    const zones = buildZones([fe('a.ts', 500), fe('src/b.ts', 3500)], cfg());
    expect(zoneIndex(zones).get('src/b.ts')).toBe('src');
    writeZoneCache(root, zones);
    expect(readZoneCache(root)).toEqual({ 'a.ts': '(root)', 'src/b.ts': 'src' });
    expect(umDir(root)).toContain('.understanding');
  });
});
