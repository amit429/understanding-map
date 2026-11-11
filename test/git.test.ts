import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeRepo, gitIn } from './helpers/repo';
import {
  readHistory, isAgentTrailer, defaultBranchRef, listTrackedFiles, repoRootOf, showAtRef, listAtRef, currentEmail, commitsWithNotes,
} from '../src/git';

const NOW = new Date('2025-02-01T00:00:00Z');

describe('readHistory', () => {
  it('returns commits newest-first with email, date and added counts', () => {
    const root = makeRepo([
      { files: { 'a.ts': '1\n2\n3\n' }, email: 'a@x.io', date: '2025-01-01T10:00:00Z' },
      { files: { 'b.ts': 'x\ny\n' }, email: 'b@x.io', date: '2025-01-02T10:00:00Z' },
      { files: { 'a.ts': '1\n2\n3\n4\n5\n' }, email: 'c@x.io', date: '2025-01-03T10:00:00Z' },
    ]);
    const h = readHistory(root, 365, NOW);
    expect(h).toHaveLength(3);
    expect(h.map((c) => c.email)).toEqual(['c@x.io', 'b@x.io', 'a@x.io']);
    expect(h[0].date.toISOString()).toBe('2025-01-03T10:00:00.000Z');
    expect(h[0].files).toEqual([{ path: 'a.ts', added: 2, deleted: 0 }]);
    expect(h[2].files).toEqual([{ path: 'a.ts', added: 3, deleted: 0 }]);
    expect(h[1].agentTrailer).toBe(false);
  });

  it('follows renames to the new path', () => {
    const root = makeRepo([{ files: { 'a.ts': 'l1\nl2\nl3\nl4\nl5\nl6\n' } }]);
    gitIn(root, ['mv', 'a.ts', 'b.ts']);
    execFileSync('mkdir', ['-p', join(root, 'lib')]);
    gitIn(root, ['mv', 'b.ts', 'lib/b.ts']);
    writeFileSync(join(root, 'lib/b.ts'), 'l1\nl2\nl3\nl4\nl5\nl6\nl7\n');
    gitIn(root, ['add', '-A']);
    gitIn(root, ['commit', '-q', '-m', 'rename'], { GIT_AUTHOR_DATE: '2025-01-10T00:00:00Z', GIT_COMMITTER_DATE: '2025-01-10T00:00:00Z' });
    const h = readHistory(root, 365, NOW);
    expect(h[0].files).toEqual([{ path: 'lib/b.ts', added: 1, deleted: 0 }]);
  });

  it('round-trips unicode and spaces in paths', () => {
    const root = makeRepo([{ files: { 'src/my file é.ts': 'a\n' } }]);
    expect(readHistory(root, 365, NOW)[0].files[0].path).toBe('src/my file é.ts');
    expect(listTrackedFiles(root)).toEqual(['src/my file é.ts']);
  });

  it('counts binary files as 0', () => {
    const root = makeRepo([{ files: { 'bin.dat': 'abc\0def\0\n' } }]);
    expect(readHistory(root, 365, NOW)[0].files).toEqual([{ path: 'bin.dat', added: 0, deleted: 0 }]);
  });

  it('excludes commits older than sinceDays', () => {
    const root = makeRepo([
      { files: { 'old.ts': 'x\n' }, date: '2024-01-01T00:00:00Z' },
      { files: { 'new.ts': 'y\n' }, date: '2025-01-20T00:00:00Z' },
    ]);
    const h = readHistory(root, 30, NOW);
    expect(h).toHaveLength(1);
    expect(h[0].files[0].path).toBe('new.ts');
  });

  it('returns [] for a repo with no commits', () => {
    const root = makeRepo([]);
    expect(readHistory(root, 365, NOW)).toEqual([]);
  });

  it('flags agent trailers in the message', () => {
    const root = makeRepo([{ files: { 'a.ts': 'x\n' }, message: 'feat\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>' }]);
    expect(readHistory(root, 365, NOW)[0].agentTrailer).toBe(true);
  });
});

describe('isAgentTrailer', () => {
  it('detects agent co-authors only', () => {
    expect(isAgentTrailer('x\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>')).toBe(true);
    expect(isAgentTrailer('x\n\nco-authored-by: GitHub Copilot <c@github.com>')).toBe(true);
    expect(isAgentTrailer('x\n\nCo-Authored-By: Sam <sam@x.io>')).toBe(false);
  });
});

describe('repo helpers', () => {
  it('defaultBranchRef is null without a remote', () => {
    expect(defaultBranchRef(makeRepo([{ files: { 'a.ts': 'x\n' } }]))).toBeNull();
  });

  it('repoRootOf returns null outside a repo and root inside', () => {
    const root = makeRepo([{ files: { 'a.ts': 'x\n' } }]);
    expect(repoRootOf(root)).toMatch(/umap-repo-/);
    expect(repoRootOf(mkdtempSync(join(tmpdir(), 'umap-norepo-')))).toBeNull();
  });

  it('showAtRef and listAtRef read from a ref', () => {
    const root = makeRepo([{ files: { 'src/a.ts': 'hello\n', 'src/b.ts': 'b\n', 'top.ts': 't\n' } }]);
    expect(showAtRef(root, 'HEAD', 'src/a.ts')).toBe('hello\n');
    expect(showAtRef(root, 'HEAD', 'nope.ts')).toBeNull();
    expect(listAtRef(root, 'HEAD', 'src')).toEqual(['src/a.ts', 'src/b.ts']);
  });

  it('currentEmail reads user.email', () => {
    const root = makeRepo([{ files: { 'a.ts': 'x\n' } }]);
    gitIn(root, ['config', 'user.email', 'me@x.io']);
    expect(currentEmail(root)).toBe('me@x.io');
  });

  it('commitsWithNotes lists annotated shas and tolerates a missing ref', () => {
    const root = makeRepo([{ files: { 'a.ts': 'x\n' } }]);
    expect(commitsWithNotes(root, 'refs/notes/umap').size).toBe(0);
    gitIn(root, ['notes', '--ref=umap', 'add', '-m', 'hi', 'HEAD']);
    const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
    expect([...commitsWithNotes(root, 'umap')]).toEqual([sha]);
  });
});
