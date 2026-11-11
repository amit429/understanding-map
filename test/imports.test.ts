import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { extractImports, fanInByZone, languageOf, resolveImport } from '../src/imports';
import type { Commit, FileEntry, Zone } from '../src/types';

const dirs: string[] = [];
function tmp(): string {
  const d = mkdtempSync(join(tmpdir(), 'umap-imports-'));
  dirs.push(d);
  return d;
}
afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});
function put(root: string, path: string, content: string): void {
  const full = join(root, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}
const fe = (path: string): FileEntry => ({ path, loc: 10, hash: `h-${path}` });
const zone = (id: string, files: string[]): Zone => ({
  id, files, loc: files.length * 10, fingerprint: Object.fromEntries(files.map((f) => [f, `h-${f}`])),
});
const commit = (sha: string, paths: string[]): Commit => ({
  sha, email: 'a@x.io', date: new Date('2026-01-01'), message: 'm', agentTrailer: false,
  files: paths.map((path) => ({ path, added: 1, deleted: 0 })),
});

describe('languageOf', () => {
  it('maps extensions, js to ts and kt to java', () => {
    expect(languageOf('a/b.ts')).toBe('ts');
    expect(languageOf('a/b.jsx')).toBe('ts');
    expect(languageOf('a/b.py')).toBe('py');
    expect(languageOf('a/b.kt')).toBe('java');
    expect(languageOf('a/b.go')).toBe('go');
    expect(languageOf('a/b.cs')).toBe('cs');
    expect(languageOf('run.sh')).toBeNull();
  });
});

describe('typescript / javascript', () => {
  it('extracts import, export-from and require specifiers', () => {
    const src = `import x from './util';\nexport * from "../lib";\nconst a = require('./a.js');\nimport './side';\nconst m = await import('./dyn');`;
    expect(extractImports('ts', src).sort()).toEqual(['../lib', './a.js', './dyn', './side', './util']);
  });
  it('resolves to a file or an index file', () => {
    const files = new Set(['src/util.ts', 'src/lib/index.ts', 'src/a.ts']);
    expect(resolveImport('src/main.ts', './util', 'ts', files)).toBe('src/util.ts');
    expect(resolveImport('src/main.ts', './lib', 'ts', files)).toBe('src/lib/index.ts');
    expect(resolveImport('src/main.ts', './a.js', 'ts', files)).toBe('src/a.ts');
    expect(resolveImport('src/main.ts', 'react', 'ts', files)).toBeNull();
    expect(resolveImport('src/main.ts', './missing', 'ts', files)).toBeNull();
  });
});

describe('python', () => {
  it('resolves relative and absolute imports', () => {
    const files = new Set(['app/models.py', 'app/db/__init__.py', 'app/views.py']);
    expect(extractImports('py', 'from .models import User\nimport app.db\n')).toEqual(['.models', 'app.db']);
    expect(resolveImport('app/views.py', '.models', 'py', files)).toBe('app/models.py');
    expect(resolveImport('app/views.py', 'app.db', 'py', files)).toBe('app/db/__init__.py');
    expect(resolveImport('app/views.py', 'os', 'py', files)).toBeNull();
  });
});

describe('go', () => {
  it('resolves a module path to a directory by trailing segments', () => {
    const files = new Set(['internal/store/s.go', 'cmd/main.go']);
    expect(extractImports('go', 'import "github.com/x/proj/internal/store"\nimport (\n  "fmt"\n  alias "github.com/x/proj/cmd"\n)')).toEqual(
      ['github.com/x/proj/internal/store', 'fmt', 'github.com/x/proj/cmd']);
    expect(resolveImport('cmd/main.go', 'github.com/x/proj/internal/store', 'go', files)).toBe('internal/store');
    expect(resolveImport('cmd/main.go', 'fmt', 'go', files)).toBeNull();
  });
});

describe('other languages', () => {
  it('java, csharp, rust, ruby and php resolve', () => {
    const jf = new Set(['src/com/acme/Foo.java', 'src/com/acme/util/H.java']);
    expect(extractImports('java', 'import com.acme.Foo;\nimport static com.acme.util.*;')).toEqual(['com.acme.Foo', 'com.acme.util.*']);
    expect(resolveImport('x/A.java', 'com.acme.Foo', 'java', jf)).toBe('src/com/acme/Foo.java');
    expect(resolveImport('x/A.java', 'com.acme.util.*', 'java', jf)).toBe('src/com/acme/util');
    const cf = new Set(['Acme/Data/Repo.cs']);
    expect(extractImports('cs', 'using Acme.Data;\nusing System;')).toEqual(['Acme.Data', 'System']);
    expect(resolveImport('Web/C.cs', 'Acme.Data', 'cs', cf)).toBe('Acme/Data');
    const rf = new Set(['src/store/mod.rs', 'src/cfg.rs', 'src/main.rs']);
    expect(extractImports('rs', 'use crate::store::Db;\nmod cfg;')).toEqual(['crate::store::Db', 'self::cfg']);
    expect(resolveImport('src/main.rs', 'crate::store::Db', 'rs', rf)).toBe('src/store/mod.rs');
    expect(resolveImport('src/main.rs', 'self::cfg', 'rs', rf)).toBe('src/cfg.rs');
    const bf = new Set(['lib/helper.rb', 'app/x.rb']);
    expect(extractImports('rb', "require_relative '../lib/helper'\nrequire 'json'")).toEqual(['../lib/helper', 'json']);
    expect(resolveImport('app/x.rb', '../lib/helper', 'rb', bf)).toBe('lib/helper.rb');
    const pf = new Set(['src/Acme/Svc.php', 'inc/f.php']);
    expect(extractImports('php', "use Acme\\Svc;\nrequire_once __DIR__ . '/../inc/f.php';").sort()).toEqual(['/../inc/f.php', 'Acme\\Svc']);
    expect(resolveImport('src/i.php', 'Acme\\Svc', 'php', pf)).toBe('src/Acme/Svc.php');
    expect(resolveImport('src/i.php', '/../inc/f.php', 'php', pf)).toBe('inc/f.php');
  });
});

describe('fanInByZone', () => {
  it('counts distinct importing files from other zones only', () => {
    const root = tmp();
    put(root, 'core/c.ts', 'export const c = 1;');
    put(root, 'core/d.ts', "import { c } from './c';");
    put(root, 'api/a1.ts', "import { c } from '../core/c';");
    put(root, 'api/a2.ts', "import { c } from '../core/c';\nimport { c as c2 } from '../core/c';");
    put(root, 'api/a3.ts', "import { c } from '../core';");
    put(root, 'core/index.ts', '');
    const paths = ['core/c.ts', 'core/d.ts', 'core/index.ts', 'api/a1.ts', 'api/a2.ts', 'api/a3.ts'];
    const zones = [zone('core', paths.slice(0, 3)), zone('api', paths.slice(3))];
    const r = fanInByZone(root, paths.map(fe), zones, []);
    expect(r.core).toBe(3);
    expect(r.api).toBe(0);
  });

  it('counts a directory import once per target zone', () => {
    const root = tmp();
    put(root, 'internal/store/a.go', 'package store');
    put(root, 'internal/store/b.go', 'package store');
    put(root, 'cmd/m.go', 'import "github.com/x/proj/internal/store"');
    const paths = ['internal/store/a.go', 'internal/store/b.go', 'cmd/m.go'];
    const zones = [zone('s1', [paths[0]]), zone('s2', [paths[1]]), zone('cmd', [paths[2]])];
    const r = fanInByZone(root, paths.map(fe), zones, []);
    expect(r.s1).toBe(1);
    expect(r.s2).toBe(1);
    expect(r.cmd).toBe(0);
  });

  it('falls back to co-change for zones with no supported-language files', () => {
    const root = tmp();
    const sh = ['scripts/a.sh', 'scripts/b.sh'];
    const others = ['x/1.ts', 'x/2.ts', 'y/3.ts', 'y/4.ts', 'y/5.ts'];
    for (const p of [...sh, ...others]) put(root, p, '');
    const zones = [zone('scripts', sh), zone('x', others.slice(0, 2)), zone('y', others.slice(2))];
    const commits = [
      commit('1', ['scripts/a.sh', 'x/1.ts', 'x/2.ts', 'y/3.ts', 'y/4.ts', 'y/5.ts']),
      commit('2', ['scripts/b.sh', 'x/1.ts', 'x/2.ts', 'y/3.ts', 'y/4.ts']),
      commit('3', ['scripts/a.sh', 'x/1.ts', 'x/2.ts', 'y/3.ts', 'y/4.ts']),
    ];
    const r = fanInByZone(root, [...sh, ...others].map(fe), zones, commits);
    expect(r.scripts).toBe(4);
    expect(r.x).toBe(0);
  });
});
