import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

export interface CommitSpec {
  files: Record<string, string | null>;
  email?: string;
  date?: string;
  message?: string;
}

function run(cwd: string, args: string[], env: NodeJS.ProcessEnv = {}): void {
  execFileSync('git', ['-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', ...args], {
    cwd,
    stdio: 'pipe',
    env: { ...process.env, HOME: cwd, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null', ...env },
  });
}

/** Creates a temp git repo with the given commits and returns its path. `null` deletes a file. */
export function makeRepo(commits: CommitSpec[]): string {
  const dir = mkdtempSync(join(tmpdir(), 'umap-repo-'));
  run(dir, ['init', '-q', '-b', 'main']);
  commits.forEach((c, i) => {
    for (const [path, content] of Object.entries(c.files)) {
      const full = join(dir, path);
      if (content === null) {
        rmSync(full, { force: true });
      } else {
        mkdirSync(dirname(full), { recursive: true });
        writeFileSync(full, content);
      }
    }
    const email = c.email ?? 'dev@example.com';
    const date = c.date ?? new Date(Date.UTC(2025, 0, 1 + i)).toISOString();
    const name = email.split('@')[0];
    run(dir, ['add', '-A']);
    run(dir, ['commit', '-q', '--allow-empty', '-m', c.message ?? `commit ${i + 1}`], {
      GIT_AUTHOR_NAME: name, GIT_AUTHOR_EMAIL: email, GIT_AUTHOR_DATE: date,
      GIT_COMMITTER_NAME: name, GIT_COMMITTER_EMAIL: email, GIT_COMMITTER_DATE: date,
    });
  });
  return dir;
}

/** Runs an arbitrary git command in a repo made by makeRepo (isolated from user config). */
export function gitIn(dir: string, args: string[], env: NodeJS.ProcessEnv = {}): void {
  run(dir, args, {
    GIT_AUTHOR_NAME: 'dev', GIT_AUTHOR_EMAIL: 'dev@example.com',
    GIT_COMMITTER_NAME: 'dev', GIT_COMMITTER_EMAIL: 'dev@example.com', ...env,
  });
}
