import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { main } from '../src/cli';
import { emptyHome, fixture } from './helpers/fixture';

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
