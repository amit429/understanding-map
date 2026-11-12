import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { umDir } from './config.js';
import type { Config } from './types.js';

/** path → reviewer GitHub login → substantive review comments. Logins are mapped to handles in the pipeline. */
export type PathCounts = Record<string, Record<string, number>>;
type Counts = PathCounts;

const BUDGET_MS = 20_000;
const CACHE_MS = 24 * 3600_000;
const MIN_COMMENT_CHARS = 20;

const ghIn = (root: string, args: string[], timeout: number): string =>
  execFileSync('gh', args, { cwd: root, timeout, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });

/** True when `gh` is installed and authenticated. */
export function ghAvailable(root: string): boolean {
  try {
    ghIn(root, ['auth', 'status'], 5000);
    return true;
  } catch {
    return false;
  }
}

const cachePath = (root: string) => join(umDir(root), 'local', 'reviews-cache.json');

/** The fresh (under 24 h) cached counts, or null. */
export function readReviewCache(root: string): Counts | null {
  try {
    const v = JSON.parse(readFileSync(cachePath(root), 'utf8')) as { fetchedAt?: unknown; counts?: unknown };
    const at = typeof v.fetchedAt === 'string' ? Date.parse(v.fetchedAt) : NaN;
    if (Number.isNaN(at) || Date.now() - at >= CACHE_MS || typeof v.counts !== 'object' || v.counts === null) return null;
    return v.counts as Counts;
  } catch {
    return null;
  }
}

/** Cache-only review counts (never calls gh), and only when the opt-in `githubReviews` signal is on. */
export function cachedReviews(root: string, config: Config): PathCounts {
  return config.githubReviews ? readReviewCache(root) ?? {} : {};
}

function writeCache(root: string, counts: Counts): void {
  try {
    mkdirSync(dirname(cachePath(root)), { recursive: true });
    writeFileSync(cachePath(root), JSON.stringify({ fetchedAt: new Date(Date.now()).toISOString(), counts }));
  } catch { /* the cache is an optimisation only */ }
}

/**
 * Substantive PR review comments (body of at least 20 characters) per file path and reviewer login, from the last
 * 50 merged PRs. Approvals without comments count for nothing. Each gh call gets the remaining share of the 20 s
 * budget as its timeout; any failure or running out of budget yields {}.
 */
export function reviewCountsByPath(
  root: string,
  run: (args: string[], timeoutMs: number) => string = (args, t) => ghIn(root, args, t),
): PathCounts {
  const cached = readReviewCache(root);
  if (cached) return cached;
  const started = Date.now();
  const call = (args: string[]): string => {
    const left = BUDGET_MS - (Date.now() - started);
    if (left <= 0) throw new Error('review budget exceeded');
    return run(args, Math.max(1, left));
  };
  try {
    const repo = call(['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner']).trim();
    const prs = JSON.parse(call(['api', `repos/${repo}/pulls?state=closed&per_page=50`, '--jq', '[.[] | {number, merged_at}]'])) as
      Array<{ number: number; merged_at: string | null }>;
    const counts: Counts = {};
    for (const pr of prs.filter((p) => p.merged_at)) {
      const comments = JSON.parse(call(['api', `repos/${repo}/pulls/${pr.number}/comments?per_page=100`])) as
        Array<{ path?: string; body?: string; user?: { login?: string } }>;
      for (const c of comments) {
        const login = c.user?.login;
        if (!c.path || !login || (c.body ?? '').trim().length < MIN_COMMENT_CHARS) continue;
        counts[c.path] ??= {};
        counts[c.path][login] = (counts[c.path][login] ?? 0) + 1;
      }
    }
    if (Date.now() - started > BUDGET_MS) return {};
    writeCache(root, counts);
    return counts;
  } catch {
    return {};
  }
}
