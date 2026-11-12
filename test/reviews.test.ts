import { mkdtempSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CONFIG } from '../src/config';
import { reviewCountsByPath } from '../src/reviews';

const long = 'This needs a null check before we charge.';
const cfg = { ...DEFAULT_CONFIG, handles: { alice: 'al' } };

function stub(comments: Record<number, unknown[]>, calls: string[][] = []) {
  return (args: string[]): string => {
    calls.push(args);
    const a = args.join(' ');
    if (a.startsWith('repo view')) return 'acme/shop\n';
    if (/pulls\?state=closed/.test(a)) {
      return JSON.stringify([{ number: 1, merged_at: '2026-01-01T00:00:00Z' }, { number: 2, merged_at: '2026-01-02T00:00:00Z' }, { number: 3, merged_at: null }]);
    }
    const m = /pulls\/(\d+)\/comments/.exec(a);
    if (m) return JSON.stringify(comments[Number(m[1])] ?? []);
    throw new Error(`unexpected ${a}`);
  };
}
const c = (login: string, path: string, body: string) => ({ user: { login }, path, body });
const tmp = () => mkdtempSync(join(tmpdir(), 'umap-rev-'));

afterEach(() => vi.restoreAllMocks());

describe('reviewCounts', () => {
  it('an approval with no comments contributes nothing', () => {
    expect(reviewCountsByPath(tmp(), cfg, stub({}))).toEqual({});
  });

  it('counts substantive review comments per path and handle, mapping logins', () => {
    const r = reviewCountsByPath(tmp(), cfg, stub({
      1: [c('alice', 'src/pay/x.ts', long), c('alice', 'src/pay/x.ts', long), c('alice', 'src/pay/x.ts', 'lgtm'), c('Bob', 'src/auth/y.ts', long)],
      2: [c('alice', 'src/unknown.ts', long)],
    }));
    expect(r).toEqual({ 'src/pay/x.ts': { al: 2 }, 'src/auth/y.ts': { bob: 1 }, 'src/unknown.ts': { al: 1 } });
  });

  it('returns {} when run throws', () => {
    expect(reviewCountsByPath(tmp(), cfg, () => { throw new Error('gh failed'); })).toEqual({});
  });

  it('returns {} (never partial) when the 20 s budget is exceeded', () => {
    let now = 1_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    const inner = stub({ 1: [c('alice', 'src/pay/x.ts', long)] });
    const slow = (args: string[]) => { now += 15_000; return inner(args); };
    expect(reviewCountsByPath(tmp(), cfg, slow)).toEqual({});
  });

  it('passes the remaining budget as each call timeout and trims the PR list', () => {
    let now = 1_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    const inner = stub({ 1: [c('alice', 'src/pay/x.ts', long)], 2: [] });
    const timeouts: number[] = [];
    const calls: string[][] = [];
    reviewCountsByPath(tmp(), cfg, (args, t) => { timeouts.push(t); now += 4_000; return inner(args); });
    reviewCountsByPath(tmp(), cfg, (args) => { calls.push(args); return inner(args); });
    expect(timeouts).toEqual([20_000, 16_000, 12_000, 8_000]);
    expect(calls.some((a) => a.includes('--jq'))).toBe(true);
  });

  it('caches for 24 hours and refetches after', () => {
    const root = tmp();
    const calls: string[][] = [];
    const run = stub({ 1: [c('alice', 'src/pay/x.ts', long)] }, calls);
    const first = reviewCountsByPath(root, cfg, run);
    expect(existsSync(join(root, '.understanding', 'local', 'reviews-cache.json'))).toBe(true);
    const n = calls.length;
    expect(reviewCountsByPath(root, cfg, () => { throw new Error('must not run'); })).toEqual(first);
    expect(calls.length).toBe(n);
    const cache = JSON.parse(readFileSync(join(root, '.understanding', 'local', 'reviews-cache.json'), 'utf8'));
    expect(Object.keys(cache).sort()).toEqual(['counts', 'fetchedAt']);
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 25 * 3600_000);
    reviewCountsByPath(root, cfg, run);
    expect(calls.length).toBeGreaterThan(n);
  });
});
