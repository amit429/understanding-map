import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { umDir } from './config.js';
import type { Config, Zone } from './types.js';
import { zoneIndex } from './zones.js';

type Counts = Record<string, Record<string, number>>;

const BUDGET_MS = 20_000;
const CACHE_MS = 24 * 3600_000;
const MIN_COMMENT_CHARS = 20;

const ghIn = (root: string, args: string[], timeout: number): string =>
  execFileSync('gh', args, { cwd: root, timeout, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

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

function readCache(root: string): Counts | null {
  try {
    const v = JSON.parse(readFileSync(cachePath(root), 'utf8')) as { fetchedAt?: unknown; counts?: unknown };
    const at = typeof v.fetchedAt === 'string' ? Date.parse(v.fetchedAt) : NaN;
    if (Number.isNaN(at) || Date.now() - at >= CACHE_MS || typeof v.counts !== 'object' || v.counts === null) return null;
    return v.counts as Counts;
  } catch {
    return null;
  }
}

function writeCache(root: string, counts: Counts): void {
  try {
    mkdirSync(dirname(cachePath(root)), { recursive: true });
    writeFileSync(cachePath(root), JSON.stringify({ fetchedAt: new Date(Date.now()).toISOString(), counts }));
  } catch { /* the cache is an optimisation only */ }
}

/**
 * Substantive PR review comments (body of at least 20 characters) per zone and reviewer handle, from the last 50
 * merged PRs. Approvals without comments count for nothing. Any failure or running out of the 20 s budget yields {}.
 */
export function reviewCounts(
  root: string, zones: Zone[], config: Config,
  run: (args: string[]) => string = (args) => ghIn(root, args, BUDGET_MS),
): Counts {
  const cached = readCache(root);
  if (cached) return cached;
  const started = Date.now();
  const overBudget = () => Date.now() - started > BUDGET_MS;
  try {
    const repo = run(['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner']).trim();
    const prs = JSON.parse(run(['api', `repos/${repo}/pulls?state=closed&per_page=50`])) as Array<{ number: number; merged_at: string | null }>;
    const zoneOf = zoneIndex(zones);
    const counts: Counts = {};
    for (const pr of prs.filter((p) => p.merged_at)) {
      if (overBudget()) return {};
      const comments = JSON.parse(run(['api', `repos/${repo}/pulls/${pr.number}/comments?per_page=100`])) as
        Array<{ path?: string; body?: string; user?: { login?: string } }>;
      for (const c of comments) {
        const zone = c.path ? zoneOf.get(c.path) : undefined;
        const login = c.user?.login;
        if (!zone || !login || (c.body ?? '').trim().length < MIN_COMMENT_CHARS) continue;
        const handle = config.handles[login] ?? login.toLowerCase();
        counts[zone] ??= {};
        counts[zone][handle] = (counts[zone][handle] ?? 0) + 1;
      }
    }
    if (overBudget()) return {};
    writeCache(root, counts);
    return counts;
  } catch {
    return {};
  }
}
