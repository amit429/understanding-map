import { mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildContext, entryHint, type ZoneContext } from '../src/context';
import { emptyHome } from './helpers/fixture';
import { journeyRepo } from './helpers/journey';

const ctx = (root: string, target?: string) => buildContext(realpathSync(root), target, { homeDir: emptyHome(), cwd: root }) as ZoneContext;
const ctxOrNull = (root: string, target?: string) => buildContext(realpathSync(root), target, { homeDir: emptyHome(), cwd: root });

describe('buildContext', () => {
  it('returns the zone with state, reason, loc, fanIn and its fingerprint', () => {
    const root = journeyRepo();
    const c = ctx(root, 'src/payments');
    if (!c.zone) throw new Error('expected a zone');
    expect(c.zone).toMatchObject({ id: 'src/payments', files: ['src/payments/charge.ts', 'src/payments/ledger.ts', 'src/payments/stripe.ts'], state: 'dark', fanIn: 2 });
    expect(c.zone.reason).toContain('Dark');
    expect(c.zone.loc).toBeGreaterThan(600);
    expect(Object.keys(c.fingerprint).sort()).toEqual(c.zone.files);
    expect(c.picked.by).toBe('argument');
  });

  it('lists inbound and outbound neighbour zones with import lines and line numbers', () => {
    const c = ctx(journeyRepo(), 'src/payments');
    if (!c.zone) throw new Error('expected a zone');
    expect(c.inbound.map((n) => n.zone)).toEqual(['src/api', 'test']);
    expect(c.inbound[0]).toMatchObject({
      zone: 'src/api', files: ['src/api/checkout.ts'],
      imports: [{ from: 'src/api/checkout.ts', line: 1, to: 'src/payments/charge.ts', text: "import { charge } from '../payments/charge';" }],
    });
    expect(c.outbound).toEqual([{
      zone: 'src/email', files: ['src/email/receipt.ts'], fileCount: 1,
      imports: [{ from: 'src/payments/ledger.ts', line: 1, to: 'src/email/receipt.ts', text: "import { receipt } from '../email/receipt';" }],
    }]);
  });

  it('finds entry hints along the inbound chain, never in tests', () => {
    const c = ctx(journeyRepo(), 'src/payments');
    if (!c.zone) throw new Error('expected a zone');
    const files = c.entryHints.map((h) => h.file);
    expect(files).toEqual(['src/api/checkout.ts', 'web/pages/checkout.ts']);
    expect(c.entryHints[1]).toMatchObject({ depth: 2 });
    expect(c.entryHints[1].why).toMatch(/app\.get\(|pages/);
  });

  it('a path spanning several zones picks the zone with most files under it and says so', () => {
    const c = ctx(journeyRepo(), 'src');
    expect(c.zone?.id).toBe('src/payments');
    expect(c.picked.note).toContain('src/payments');
    expect(c.picked.note).toMatch(/3 zones/);
    expect(ctx(journeyRepo(), 'src/api/checkout.ts').zone?.id).toBe('src/api');
  });

  it('with no argument uses the last learn zone, then the top danger zone', () => {
    const root = journeyRepo();
    const top = ctx(root);
    expect(top.zone?.id).toBe('src/payments');
    expect(top.picked.by).toBe('top-danger');
    mkdirSync(join(root, '.understanding', 'local'), { recursive: true });
    writeFileSync(join(root, '.understanding', 'local', 'last-learn.json'), JSON.stringify({ zone: 'src/email', date: '2026-11-01T00:00:00.000Z' }));
    const last = ctx(root);
    expect(last.zone?.id).toBe('src/email');
    expect(last.picked.by).toBe('last-learn');
    writeFileSync(join(root, '.understanding', 'local', 'last-learn.json'), JSON.stringify({ zone: 'gone', date: '2026-11-01T00:00:00.000Z' }));
    expect(ctx(root).picked.by).toBe('top-danger');
  });

  it('caps neighbours at 8 zones and 5 files each', () => {
    const files: Record<string, string> = { 'core/c.ts': Array.from({ length: 200 }, (_, i) => `// c ${i}`).join('\n') };
    for (let z = 0; z < 10; z++) {
      for (let f = 0; f < 7; f++) files[`u${z}/f${f}.ts`] = ["import { c } from '../core/c';", ...Array.from({ length: 30 }, (_, i) => `// ${i}`)].join('\n');
    }
    const root = journeyRepoFrom(files);
    const c = ctx(root, 'core');
    expect(c.inbound).toHaveLength(8);
    for (const n of c.inbound) {
      expect(n.files.length).toBeLessThanOrEqual(5);
      expect(n.fileCount).toBe(7);
      expect(n.imports.every((i) => n.files.includes(i.from))).toBe(true);
    }
  });

  it('returns zone null with a reason when nothing is picked and the target is unknown', () => {
    const c = ctxOrNull(journeyRepo(), 'nope/nowhere');
    expect(c.zone).toBeNull();
    expect(c.zone === null && c.why).toContain('nope/nowhere');
  });
});

describe('entryHint', () => {
  it.each([
    ['src/routes/user.ts', '', /routes/],
    ['cmd/server/main.go', 'package main\nfunc main() {}', /func main|cmd|main/],
    ['lib/x.ts', "router.post('/a', h)", /router\./],
    ['svc/Thing.java', '@RestController\nclass Thing {}', /Controller/],
    ['tool.py', "if __name__ == '__main__':\n  run()", /__main__/],
    ['app/page.tsx', 'export default function Page() {}', /export default function|app/],
  ])('%s is an entry point', (path, source, why) => {
    expect(entryHint(path, source)).toMatch(why);
  });

  it.each([['src/util/strings.ts', 'export const a = 1;'], ['test/api.test.ts', "app.get('/x')"], ['src/__tests__/main.ts', ''], ['pkg/a_test.go', 'func main() {}']])(
    '%s is not', (path, source) => expect(entryHint(path, source)).toBeNull());
});

import { makeRepo } from './helpers/repo';
function journeyRepoFrom(files: Record<string, string>): string {
  return makeRepo([{ files }]);
}
