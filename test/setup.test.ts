import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { machineId } from '../src/attribution';
import { main } from '../src/cli';
import { runSetup } from '../src/setup';
import { buildMap } from '../src/pipeline';
import { emptyHome, fixture } from './helpers/fixture';

const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, HOME: cwd, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null' } });
const read = (root: string, p: string) => readFileSync(join(root, p), 'utf8');

async function run(cwd: string, argv: string[]) {
  vi.spyOn(process, 'cwd').mockReturnValue(cwd);
  vi.stubEnv('HOME', emptyHome());
  let stdout = '';
  let stderr = '';
  vi.spyOn(process.stdout, 'write').mockImplementation((s) => { stdout += String(s); return true; });
  vi.spyOn(process.stderr, 'write').mockImplementation((s) => { stderr += String(s); return true; });
  const code = await main(argv);
  return { code, stdout, stderr };
}

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

describe('runSetup', () => {
  it('solo ignores everything in .understanding/ and leaves root files alone', () => {
    const root = fixture();
    const before = git(root, 'log', '--oneline');
    const r = runSetup(root, { mode: 'solo', critical: ['src/**'] });
    expect(r.gitignoreLines).toEqual(['*']);
    expect(r.gitattributesLines).toEqual([]);
    expect(read(root, '.understanding/.gitignore')).toBe('*\n');
    expect(existsSync(join(root, '.gitignore'))).toBe(false);
    expect(existsSync(join(root, '.gitattributes'))).toBe(false);
    expect(JSON.parse(readFileSync(r.configPath, 'utf8'))).toMatchObject({ mode: 'solo', critical: ['src/**'] });
    expect(machineId(root)).toMatch(/^[0-9a-f]{8}$/);
    expect(git(root, 'log', '--oneline')).toBe(before);
  });

  it('team ignores local/ and report.html, adds union attributes once, and shares only config', async () => {
    const root = fixture();
    const before = git(root, 'log', '--oneline');
    runSetup(root, { mode: 'team', critical: [] });
    const second = runSetup(root, { mode: 'team', critical: [] });
    expect(second.gitignoreLines).toEqual(['local/', 'report.html']);
    expect(second.gitattributesLines).toEqual([]);
    expect(read(root, '.understanding/.gitignore')).toBe('local/\nreport.html\n');
    const attrs = read(root, '.gitattributes').split('\n').filter(Boolean);
    expect(attrs).toEqual([
      '.understanding/events/*.jsonl merge=union',
      '.understanding/agent-share/*.jsonl merge=union',
    ]);
    expect(existsSync(join(root, '.gitignore'))).toBe(false);

    vi.spyOn(process, 'cwd').mockReturnValue(root);
    vi.stubEnv('HOME', emptyHome());
    await run(root, ['map']);
    const status = git(root, 'status', '--porcelain', '--untracked-files=all');
    expect(status).toContain('.understanding/config.json');
    expect(status).not.toContain('.understanding/local/');
    expect(status).not.toContain('report.html');
    expect(git(root, 'log', '--oneline')).toBe(before);
  });

  it('preserves existing .gitattributes content and adds a missing newline', () => {
    const root = fixture();
    writeFileSync(join(root, '.gitattributes'), '*.png binary');
    const r = runSetup(root, { mode: 'team', critical: [] });
    expect(r.gitattributesLines).toHaveLength(2);
    expect(read(root, '.gitattributes').split('\n')).toEqual([
      '*.png binary',
      '.understanding/events/*.jsonl merge=union',
      '.understanding/agent-share/*.jsonl merge=union',
      '',
    ]);
  });

  it('switching team to solo rewrites the ignore file', () => {
    const root = fixture();
    runSetup(root, { mode: 'team', critical: [] });
    runSetup(root, { mode: 'solo', critical: [] });
    expect(read(root, '.understanding/.gitignore')).toBe('*\n');
  });

  it('keeps unknown keys of an existing config.json', () => {
    const root = fixture();
    runSetup(root, { mode: 'solo', critical: [] });
    const p = join(root, '.understanding/config.json');
    writeFileSync(p, JSON.stringify({ mode: 'solo', threshold: 70, zones: { a: ['x/**'] } }));
    runSetup(root, { mode: 'team', critical: ['x/**'] });
    expect(JSON.parse(readFileSync(p, 'utf8'))).toEqual({ mode: 'team', threshold: 70, zones: { a: ['x/**'] }, critical: ['x/**'] });
    expect(() => buildMap(root)).not.toThrow();
  });
});

describe('cli setup', () => {
  it('rejects a missing or invalid mode with usage and exit 2', async () => {
    const root = fixture();
    for (const argv of [['setup'], ['setup', '--mode', 'huge']]) {
      const r = await run(root, argv);
      expect(r.code).toBe(2);
      expect(r.stderr).toContain('Usage: setup --mode solo|team');
    }
    expect(existsSync(join(root, '.understanding/config.json'))).toBe(false);
  });

  it('team setup writes config, explains what to commit, and status reports setUp', async () => {
    const root = fixture();
    const r = await run(root, ['setup', '--mode', 'team', '--critical', 'src/**, lib/**']);
    expect(r.code).toBe(0);
    expect(r.stdout).toContain('Commit .understanding/config.json, events/ and agent-share/ with your normal commits — only passes and anonymous zone totals are shared.');
    expect(JSON.parse(read(root, '.understanding/config.json'))).toMatchObject({ mode: 'team', critical: ['src/**', 'lib/**'] });
    const s = JSON.parse((await run(root, ['status', '--json'])).stdout);
    expect(s).toMatchObject({ setUp: true, mode: 'team' });
  });

  it('solo setup says everything stays local', async () => {
    const root = fixture();
    const r = await run(root, ['setup', '--mode', 'solo']);
    expect(r.code).toBe(0);
    expect(r.stdout).toContain('stays on this machine');
    expect(JSON.parse(read(root, '.understanding/config.json')).critical).toEqual([]);
  });
});
