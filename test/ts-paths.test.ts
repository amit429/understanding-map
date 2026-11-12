import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { fanInByZone, importEdges } from '../src/imports';
import { aliasCandidates, loadTsPaths, parseJsonc } from '../src/ts-paths';
import type { FileEntry, Zone } from '../src/types';

const dirs: string[] = [];
function tmp(): string {
  const d = mkdtempSync(join(tmpdir(), 'umap-tspaths-'));
  dirs.push(d);
  return d;
}
afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});
function put(root: string, files: Record<string, string>): string[] {
  for (const [path, content] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  return Object.keys(files);
}
const fe = (path: string): FileEntry => ({ path, loc: 10, hash: `h-${path}` });
const zone = (id: string, files: string[]): Zone => ({
  id, files, loc: files.length * 10, fingerprint: Object.fromEntries(files.map((f) => [f, `h-${f}`])),
});

describe('parseJsonc', () => {
  it('accepts comments and trailing commas like tsconfig does, without touching strings', () => {
    const v = parseJsonc('{\n  // line comment\n  "a": "http://x/*not a comment*/", /* block */\n  "b": [1, 2,],\n}\n');
    expect(v).toEqual({ a: 'http://x/*not a comment*/', b: [1, 2] });
  });
  it('returns null for unparseable input', () => {
    expect(parseJsonc('{ nope')).toBeNull();
  });
});

describe('tsconfig path aliases', () => {
  it('resolves "@/*": ["src/*"] (Angular/Vite style) for files under the config', () => {
    const root = tmp();
    const known = new Set(put(root, {
      'tsconfig.json': '{ "compilerOptions": { /* aliases */ "paths": { "@/*": ["src/*"] } } }',
      'src/app/pages/diet.page.ts': "import { DietLog } from '@/app/services/diet-log.service';\n",
      'src/app/services/diet-log.service.ts': 'export class DietLog {}\n',
    }));
    const tsPaths = loadTsPaths(root, known);
    expect(aliasCandidates('src/app/pages/diet.page.ts', '@/app/services/diet-log.service', tsPaths))
      .toContain('src/app/services/diet-log.service');
    expect(importEdges(root, [...known])).toEqual([
      { fromFile: 'src/app/pages/diet.page.ts', line: 1, toFile: 'src/app/services/diet-log.service.ts' },
    ]);
  });

  it('resolves index files and exact (non-wildcard) aliases', () => {
    const root = tmp();
    const known = new Set(put(root, {
      'tsconfig.json': '{ "compilerOptions": { "paths": { "@models": ["src/app/models/index.ts"], "@/*": ["src/*"] } } }',
      'src/a.ts': "import '@models';\nimport '@/app/models';\n",
      'src/app/models/index.ts': 'export {};\n',
    }));
    const edges = importEdges(root, [...known]).map((e) => `${e.line}:${e.toFile}`);
    expect(edges).toEqual(['1:src/app/models/index.ts', '2:src/app/models/index.ts']);
  });

  it('uses baseUrl for bare imports, and paths relative to baseUrl when it is set', () => {
    const root = tmp();
    const known = new Set(put(root, {
      'tsconfig.json': '{ "compilerOptions": { "baseUrl": "src", "paths": { "~/*": ["lib/*"] } } }',
      'src/main.ts': "import 'app/models';\nimport '~/util';\nimport '@angular/core';\n",
      'src/app/models/index.ts': 'export {};\n',
      'src/lib/util.ts': 'export {};\n',
    }));
    const edges = importEdges(root, [...known]).map((e) => `${e.line}:${e.toFile}`);
    expect(edges).toEqual(['1:src/app/models/index.ts', '2:src/lib/util.ts']);
  });

  it('follows a relative "extends" and lets the nearest config win in a monorepo', () => {
    const root = tmp();
    const known = new Set(put(root, {
      'tsconfig.base.json': '{ "compilerOptions": { "paths": { "@shared/*": ["packages/shared/*"] } } }',
      'packages/web/tsconfig.json': '{ "extends": "../../tsconfig.base.json", "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }',
      'packages/web/src/page.ts': "import '@/thing';\n",
      'packages/web/src/thing.ts': 'export {};\n',
      'packages/api/src/handler.ts': "import '@shared/db';\n",
      'packages/shared/db.ts': 'export {};\n',
      'tsconfig.json': '{ "extends": "./tsconfig.base.json" }',
    }));
    const edges = importEdges(root, [...known]).map((e) => `${e.fromFile}->${e.toFile}`);
    expect(edges).toEqual([
      'packages/api/src/handler.ts->packages/shared/db.ts',
      'packages/web/src/page.ts->packages/web/src/thing.ts',
    ]);
  });

  it('never resolves package imports, and survives a broken tsconfig', () => {
    const root = tmp();
    const known = new Set(put(root, {
      'tsconfig.json': '{ "compilerOptions": { "paths": ',
      'src/a.ts': "import '@angular/core';\nimport './b';\n",
      'src/b.ts': 'export {};\n',
    }));
    expect(importEdges(root, [...known]).map((e) => e.toFile)).toEqual(['src/b.ts']);
  });

  it('counts alias importers in fan-in (the VoxFit case: services imported only via "@/")', () => {
    const root = tmp();
    const files = put(root, {
      'tsconfig.json': '{ "compilerOptions": { "paths": { "@/*": ["src/*"] } } }',
      'src/app/pages/diet/diet.page.ts': "import { A } from '@/app/services/auth.service';\n",
      'src/app/pages/home/home.page.ts': "import { A } from '@/app/services/auth.service';\n",
      'src/app/services/auth.service.ts': 'export class A {}\n',
    });
    const zones = [
      zone('src/app/pages/diet', ['src/app/pages/diet/diet.page.ts']),
      zone('src/app/pages/home', ['src/app/pages/home/home.page.ts']),
      zone('src/app/services', ['src/app/services/auth.service.ts']),
      zone('(root)', ['tsconfig.json']),
    ];
    const fanIn = fanInByZone(root, files.map(fe), zones, []);
    expect(fanIn['src/app/services']).toBe(2);
  });
});
