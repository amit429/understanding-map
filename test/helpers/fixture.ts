import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gitIn, makeRepo } from './repo';

export const NOW = new Date('2026-11-12T12:00:00Z');
export const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString();
export const body = (tag: string, n = 200) => Array.from({ length: n }, (_, i) => `${tag} line ${i}`).join('\n') + '\n';
export const AGENT = 'feat: generated\n\nCo-Authored-By: Claude <noreply@anthropic.com>';

/** 3 zones: agent/ (agent trailer), human/ (human, recent), old/ (untouched for 800 days). */
export function fixture(team = false): string {
  const root = makeRepo([
    { files: { 'old/o.ts': body('o') }, date: daysAgo(800) },
    { files: { 'agent/a.ts': body('a') }, date: daysAgo(10), message: AGENT },
    { files: { 'human/h.ts': body('h') }, date: daysAgo(5) },
  ]);
  gitIn(root, ['config', 'user.email', 'dev@example.com']);
  if (team) {
    mkdirSync(join(root, '.understanding'), { recursive: true });
    writeFileSync(join(root, '.understanding', 'config.json'), JSON.stringify({ mode: 'team' }));
  }
  return root;
}
export const emptyHome = () => mkdtempSync(join(tmpdir(), 'umap-home-'));

