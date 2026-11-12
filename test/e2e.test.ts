import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, realpathSync, symlinkSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { makeRepo } from './helpers/repo.js';

const root = resolve(__dirname, '..');
const bundle = join(root, 'dist', 'umap.js');

function umap(cwd: string, args: string[], input = '') {
  return spawnSync('node', [bundle, ...args], { cwd, input, encoding: 'utf8', env: { ...process.env, UMAP_NO_GH: '1' } });
}

function fixture(): string {
  return makeRepo([{ files: { 'src/a.ts': 'export const a = 1;\n', 'src/b.ts': "import { a } from './a';\nexport const b = a;\n" } }]);
}

describe('bundle', () => {
  beforeAll(() => {
    execFileSync('npm', ['run', 'build'], { cwd: root, stdio: 'pipe' });
  }, 60_000);

  it('maps a fixture repo to JSON', () => {
    const r = umap(fixture(), ['map', '--json', '--no-report']);
    expect(r.status).toBe(0);
    expect(Array.isArray(JSON.parse(r.stdout).zones)).toBe(true);
  });

  it('requires nothing outside Node built-ins', () => {
    const src = readFileSync(bundle, 'utf8');
    const builtins = new Set([...builtinModules, ...builtinModules.map((m) => `node:${m}`)]);
    const refs = [...src.matchAll(/\brequire\(\s*["']([^"']+)["']\s*\)/g), ...src.matchAll(/\bfrom\s*["']([^"']+)["']/g)].map((m) => m[1]);
    expect(refs.filter((m) => !builtins.has(m))).toEqual([]);
  });

  it('runs through a symlink to the bundle', () => {
    const dir = realpathSync(mkdtempSync(join(tmpdir(), 'umap-link-')));
    const link = join(dir, 'umap-link.js');
    symlinkSync(bundle, link);
    const r = spawnSync('node', [link, 'map', '--json', '--no-report'], { cwd: fixture(), encoding: 'utf8', env: { ...process.env, UMAP_NO_GH: '1' } });
    expect(r.status).toBe(0);
    expect(r.stdout.length).toBeGreaterThan(0);
  });

  it('hook stop with empty input exits 0 silently', () => {
    const r = umap(fixture(), ['hook', 'stop'], '{}');
    expect(r.status).toBe(0);
    expect(r.stdout).toBe('');
  });

  it.runIf(process.env.UMAP_E2E === '1')('maps a real repo in under 120 s', () => {
    const dir = mkdtempSync(join(tmpdir(), 'umap-fastify-'));
    execFileSync('git', ['clone', '--quiet', 'https://github.com/fastify/fastify', join(dir, 'fastify')], { stdio: 'pipe' });
    const cwd = join(dir, 'fastify');
    const started = Date.now();
    const r = umap(cwd, ['map', '--no-report']);
    const secs = (Date.now() - started) / 1000;
    const files = execFileSync('git', ['ls-files', '-z'], { cwd, encoding: 'utf8', maxBuffer: 1 << 28 }).split('\0').filter(Boolean);
    let lines = 0;
    for (const f of files) { try { lines += readFileSync(join(cwd, f), 'utf8').split('\n').length; } catch { /* skip */ } }
    console.log(`fastify: ${lines} lines, ${secs.toFixed(1)} s`);
    expect(r.status).toBe(0);
    expect(secs).toBeLessThan(120);
  }, 180_000);
});
