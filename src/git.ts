import { execFileSync } from 'node:child_process';
import type { Commit, FileChange } from './types';

export class GitError extends Error {
  constructor(message: string, public readonly status: number | null, public readonly stderr: string) {
    super(message);
    this.name = 'GitError';
  }
}

/** Runs a read-only git command in `root` and returns stdout. Throws GitError on non-zero exit. */
export function git(root: string, args: string[]): string {
  try {
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, LC_ALL: 'C' },
      maxBuffer: 512 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (e) {
    const err = e as { status?: number | null; stderr?: Buffer | string; message?: string };
    const stderr = String(err.stderr ?? '');
    throw new GitError(`git ${args.join(' ')} failed: ${stderr.trim() || err.message}`, err.status ?? null, stderr);
  }
}

export function repoRootOf(cwd: string): string | null {
  try {
    return git(cwd, ['rev-parse', '--show-toplevel']).trim() || null;
  } catch {
    return null;
  }
}

export function listTrackedFiles(root: string): string[] {
  return git(root, ['ls-files', '-z']).split('\0').filter(Boolean);
}

const AGENT_RE = /^co-authored-by:.*\b(claude|anthropic|copilot|cursor|codex|devin|aider|gemini|openai|windsurf|cline|jules)\b/im;

export function isAgentTrailer(message: string): boolean {
  return AGENT_RE.test(message);
}

function parseNumstat(body: string): FileChange[] {
  const tokens = body.replace(/^[\n\0]+/, '').split('\0');
  const files: FileChange[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i].replace(/^\n+/, '');
    if (!tok) continue;
    const m = /^(\d+|-)\t(\d+|-)\t(.*)$/s.exec(tok);
    if (!m) continue;
    let path = m[3];
    if (path === '') {
      // rename/copy form: "added\tdeleted\t\0old\0new\0"
      path = tokens[i + 2] ?? '';
      i += 2;
    }
    files.push({
      path,
      added: m[1] === '-' ? 0 : Number(m[1]),
      deleted: m[2] === '-' ? 0 : Number(m[2]),
    });
  }
  return files;
}

export function readHistory(root: string, sinceDays: number, now: Date = new Date()): Commit[] {
  const since = new Date(now.getTime() - sinceDays * 86_400_000).toISOString();
  try {
    git(root, ['rev-parse', '--verify', '-q', 'HEAD']);
  } catch {
    return []; // no commits yet (exit status based, locale independent)
  }
  const out = git(root, [
    'log', '--no-merges', '-M', '-z', '--numstat', `--since=${since}`,
    '--format=%x1e%H%x1f%ae%x1f%aI%x1f%B%x1f',
  ]);
  const commits: Commit[] = [];
  for (const rec of out.split('\x1e')) {
    if (!rec.trim()) continue;
    const [sha, email, date, message, body = ''] = rec.split('\x1f');
    commits.push({
      sha,
      email,
      date: new Date(date),
      message,
      agentTrailer: isAgentTrailer(message),
      files: parseNumstat(body),
    });
  }
  return commits;
}

export function currentEmail(root: string): string {
  try {
    return git(root, ['config', 'user.email']).trim();
  } catch {
    return '';
  }
}

export function defaultBranchRef(root: string): string | null {
  try {
    const ref = git(root, ['symbolic-ref', '--short', 'refs/remotes/origin/HEAD']).trim();
    if (ref) return ref;
  } catch { /* fall through */ }
  for (const ref of ['origin/main', 'origin/master']) {
    try {
      git(root, ['rev-parse', '--verify', '--quiet', `refs/remotes/${ref}`]);
      return ref;
    } catch { /* try next */ }
  }
  return null;
}

export function showAtRef(root: string, ref: string, path: string): string | null {
  try {
    return git(root, ['show', `${ref}:${path}`]);
  } catch {
    return null;
  }
}

export function listAtRef(root: string, ref: string, dir: string): string[] {
  const d = dir.replace(/^\.\//, '').replace(/\/+$/, '');
  try {
    const args = ['ls-tree', '-r', '--name-only', '-z', ref];
    if (d) args.push('--', `${d}/`);
    return git(root, args).split('\0').filter(Boolean);
  } catch {
    return [];
  }
}

export function commitsWithNotes(root: string, notesRef: string): Set<string> {
  try {
    const out = git(root, ['notes', `--ref=${notesRef}`, 'list']);
    const set = new Set<string>();
    for (const line of out.split('\n')) {
      const parts = line.trim().split(/\s+/);
      if (parts[1]) set.add(parts[1]);
    }
    return set;
  } catch {
    return new Set();
  }
}
