import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync, readFileSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { main, optionalReviews } from '../src/cli';
import { DEFAULT_CONFIG } from '../src/config';
import { emptyHome, fixture } from './helpers/fixture';

async function run(cwd: string, argv: string[]) {
  vi.spyOn(process, 'cwd').mockReturnValue(cwd);
  vi.stubEnv('HOME', emptyHome());
  vi.stubEnv('UMAP_NO_GH', '1');
  let stdout = '';
  let stderr = '';
  vi.spyOn(process.stdout, 'write').mockImplementation((s) => { stdout += String(s); return true; });
  vi.spyOn(process.stderr, 'write').mockImplementation((s) => { stderr += String(s); return true; });
  const code = await main(argv);
  return { code, stdout, stderr };
}

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

describe('cli', () => {
  it('map outside a git repository says so and returns 2', async () => {
    const r = await run(mkdtempSync(join(tmpdir(), 'umap-nogit-')), ['map']);
    expect(r.code).toBe(2);
    expect(r.stderr).toContain('Understanding Map needs a git repository');
  });

  it('status --json reports setUp, mode and root', async () => {
    const root = fixture();
    const r = await run(root, ['status', '--json']);
    expect(r.code).toBe(0);
    const j = JSON.parse(r.stdout);
    expect(j).toMatchObject({ setUp: false, mode: 'solo' });
    expect(j.root).toContain('umap-repo-');
  });

  it('map works before setup and says so; --json is one parseable object', async () => {
    const root = fixture();
    const t = await run(root, ['map']);
    expect(t.stdout).toContain('Not set up yet — run /understanding-map:setup to choose solo or team.');
    const j = await run(root, ['map', '--json']);
    expect(JSON.parse(j.stdout).zones.length).toBe(3);
  });

  it('map writes .understanding/report.html and prints its path; --no-report writes nothing; --json stays one object', async () => {
    const root = fixture();
    const noReport = await run(root, ['map', '--no-report']);
    expect(existsSync(join(root, '.understanding', 'report.html'))).toBe(false);
    expect(noReport.stdout).not.toContain('Report:');
    const j = await run(root, ['map', '--json']);
    expect(() => JSON.parse(j.stdout)).not.toThrow();
    expect(existsSync(join(root, '.understanding', 'report.html'))).toBe(true);
    rmSync(join(root, '.understanding', 'report.html'));
    const t = await run(root, ['map']);
    expect(t.stdout).toContain(`Report: ${join(realpathSync(root), '.understanding', 'report.html')}`);
    expect(readFileSync(join(root, '.understanding', 'report.html'), 'utf8')).toContain('Scores are estimates');
  });

  it('a report write failure does not take map down', async () => {
    const root = fixture();
    mkdirSync(join(root, '.understanding', 'report.html'), { recursive: true });
    const j = await run(root, ['map', '--json']);
    expect(j.code).toBe(0);
    expect(JSON.parse(j.stdout).zones.length).toBe(3);
    expect(j.stderr).toContain('Could not write the HTML report');
    const t = await run(root, ['map']);
    expect(t.code).toBe(0);
    expect(t.stdout).toContain('Understanding Map — 3 zones');
    expect(t.stdout).not.toContain('Report:');
    expect(t.stderr).toContain('Could not write the HTML report');
  });

  it('map keeps .understanding/ out of git and never overwrites an existing .gitignore', async () => {
    const root = fixture();
    await run(root, ['map']);
    expect(readFileSync(join(root, '.understanding', '.gitignore'), 'utf8').trim()).toBe('*');
    const status = execFileSync('git', ['status', '--porcelain'], { cwd: root, env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null' } }).toString();
    expect(status).not.toContain('.understanding');
    const other = fixture();
    mkdirSync(join(other, '.understanding'), { recursive: true });
    writeFileSync(join(other, '.understanding', '.gitignore'), 'local/\n');
    await run(other, ['map']);
    expect(readFileSync(join(other, '.understanding', '.gitignore'), 'utf8')).toBe('local/\n');
  });

  it('zone resolves a file path to its zone', async () => {
    const root = fixture();
    const r = await run(root, ['zone', 'human/h.ts', '--json']);
    expect(r.code).toBe(0);
    expect(JSON.parse(r.stdout).zone.id).toBe('human');
  });

  it('who prints nobody (Dark) and evidence for a dark zone', async () => {
    const r = await run(fixture(), ['who', 'agent/a.ts']);
    expect(r.stdout).toContain('nobody (Dark)');
    expect(r.stdout).toContain('written by agents');
  });

  it('pick --json returns the top zone with a reason', async () => {
    const r = await run(fixture(), ['pick', '--json']);
    const j = JSON.parse(r.stdout);
    expect(j.zone.zone.id).toBe('agent');
    expect(j.why).toContain('Dark');
  });

  it('prints one line and returns 1 on unexpected errors', async () => {
    const root = fixture();
    const { writeFileSync, mkdirSync } = await import('node:fs');
    mkdirSync(join(root, '.understanding'), { recursive: true });
    writeFileSync(join(root, '.understanding', 'config.json'), '{bad');
    const r = await run(root, ['map']);
    expect(r.code).toBe(1);
    expect(r.stderr.trim().split('\n')).toHaveLength(1);
  });
});

describe('cli record and handoff', () => {
  it('record --json prints result and changes; text form shows the transition', async () => {
    const root = fixture();
    const j = await run(root, ['record', '--kind', 'session', '--zones', 'agent', '--grades', 'pass,pass', '--json']);
    expect(j.code).toBe(0);
    expect(JSON.parse(j.stdout)).toMatchObject({ result: 'pass', changes: [{ zone: 'agent', before: 'dark', after: 'owned' }] });
    const t = await run(root, ['record', '--kind', 'session', '--zones', 'human', '--grades', 'pass']);
    expect(t.stdout).toMatch(/^Result: pass\nhuman: \w+ → Owned \(level \d+ → 80\)\n$/);
  });

  it('record text always starts with the Result line and prints only real changes, or says nothing changed', async () => {
    const root = fixture();
    const first = await run(root, ['record', '--kind', 'session', '--zones', 'agent', '--grades', 'pass,pass']);
    expect(first.stdout).toMatch(/^Result: pass\nagent: Dark → Owned \(level \d+ → 80\)\n$/);
    const again = await run(root, ['record', '--kind', 'session', '--zones', 'agent', '--grades', 'pass,pass']);
    expect(again.stdout).toBe('Result: pass\nNo change on the map.\n');
    const againJson = await run(root, ['record', '--kind', 'session', '--zones', 'agent', '--grades', 'pass', '--json']);
    expect(JSON.parse(againJson.stdout)).toEqual({ result: 'pass', changes: [] });
    const miss = await run(root, ['record', '--kind', 'session', '--zones', 'old', '--grades', 'miss,miss']);
    expect(miss.stdout).toBe('Result: miss\nNo change on the map.\n');
  });

  it('rejects bad input with exit 2', async () => {
    const root = fixture();
    expect((await run(root, ['record', '--kind', 'session', '--zones', 'agent', '--grades', 'great'])).code).toBe(2);
    expect((await run(root, ['record', '--kind', 'session', '--zones', 'agent', '--grades', 'pass,pass,pass,pass'])).code).toBe(2);
    const u = await run(root, ['record', '--kind', 'session', '--zones', 'nope', '--grades', 'pass']);
    expect(u.code).toBe(2);
    expect(u.stderr).toContain('Unknown zone');
    const h = await run(root, ['record', '--kind', 'handoff', '--grades', 'pass']);
    expect(h.code).toBe(2);
    expect(h.stderr).toContain('Nothing to check — no agent changes since the last check.');
  });

  it('handoff-set, handoff-skip and unverifiable work end to end', async () => {
    const root = fixture();
    await run(root, ['map', '--no-report']);
    const { appendEdit } = await import('../src/editlog');
    appendEdit(root, { file: 'agent/a.ts', ranges: [], lines: 70, session: 's', ts: '2026-11-01T00:00:00.000Z' });
    const s = await run(root, ['handoff-set', '--json']);
    expect(JSON.parse(s.stdout)).toMatchObject({ totalLines: 70, zones: [{ zone: 'agent' }] });
    const k = await run(root, ['handoff-skip']);
    expect(k.code).toBe(0);
    expect(JSON.parse((await run(root, ['handoff-set', '--json'])).stdout).zones).toEqual([]);
    const u = await run(root, ['unverifiable', '--zone', 'human']);
    expect(u.stdout).toContain('human');
    expect(JSON.parse(readFileSync(join(root, '.understanding', 'local', 'flags.json'), 'utf8'))).toEqual({
      agent: ['unreviewed-agent-code'], human: ['hard-to-verify'],
    });
  });
});

const ON = { ...DEFAULT_CONFIG, githubReviews: true };
const writeReviewCache = (dir: string, counts: unknown) => {
  mkdirSync(join(dir, '.understanding', 'local'), { recursive: true });
  writeFileSync(join(dir, '.understanding', 'local', 'reviews-cache.json'), JSON.stringify({ fetchedAt: new Date().toISOString(), counts }));
};
const writeConfig = (dir: string, config: unknown) => {
  mkdirSync(join(dir, '.understanding'), { recursive: true });
  writeFileSync(join(dir, '.understanding', 'config.json'), JSON.stringify(config));
};

describe('optionalReviews', () => {
  const root = () => mkdtempSync(join(tmpdir(), 'umap-opt-'));

  it('is off by default: never probes gh and ignores even a fresh cache', () => {
    const dir = root();
    writeReviewCache(dir, { 'a.ts': { al: 1 } });
    const probe = vi.fn(() => true);
    const run = vi.fn(() => '');
    expect(optionalReviews(dir, DEFAULT_CONFIG, { ghAvailable: probe, run })).toEqual({});
    expect(probe).not.toHaveBeenCalled();
    expect(run).not.toHaveBeenCalled();
  });

  it('yields {} when gh is unavailable, throws, or UMAP_NO_GH=1, so map is unaffected', () => {
    expect(optionalReviews(root(), ON, { ghAvailable: () => false })).toEqual({});
    expect(optionalReviews(root(), ON, { ghAvailable: () => { throw new Error('boom'); } })).toEqual({});
    expect(optionalReviews(root(), ON, { ghAvailable: () => true, run: () => { throw new Error('gh failed'); } })).toEqual({});
    vi.stubEnv('UMAP_NO_GH', '1');
    const probe = vi.fn(() => true);
    expect(optionalReviews(root(), ON, { ghAvailable: probe })).toEqual({});
    expect(probe).not.toHaveBeenCalled();
  });

  it('map still succeeds with a failing gh path', async () => {
    const dir = fixture();
    const r = await run(dir, ['map', '--no-report', '--json']);
    expect(r.code).toBe(0);
    expect(optionalReviews(dir, ON, { ghAvailable: () => true, run: () => { throw new Error('x'); } })).toEqual({});
    expect(JSON.parse(r.stdout).zones.length).toBeGreaterThan(0);
  });

  it('a fresh cache is used without probing gh', () => {
    const dir = root();
    writeReviewCache(dir, { 'a.ts': { al: 1 } });
    const probe = vi.fn(() => false);
    expect(optionalReviews(dir, ON, { ghAvailable: probe })).toEqual({ 'a.ts': { al: 1 } });
    expect(probe).not.toHaveBeenCalled();
  });
});

describe('cached reviews in every command', () => {
  it('who and zone use the review cache only when githubReviews is on', async () => {
    const dir = fixture();
    writeReviewCache(dir, { 'human/h.ts': { dev: 3 } });
    const reviewed = (s: string) => s.includes('reviewed 3 changes here');
    expect(reviewed((await run(dir, ['who', 'human/h.ts'])).stdout)).toBe(false);
    writeConfig(dir, { githubReviews: true });
    expect(reviewed((await run(dir, ['who', 'human/h.ts'])).stdout)).toBe(true);
    expect(reviewed((await run(dir, ['zone', 'human', '--json'])).stdout)).toBe(true);
  });
});
