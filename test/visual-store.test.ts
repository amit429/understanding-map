import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Storyboard } from '../src/storyboard';
import { checkFresh, readSavedVisual, saveVisual, visualFingerprint, visualSlug } from '../src/visual-store';

const h6 = (s: string) => createHash('sha1').update(s).digest('hex').slice(0, 6);

describe('visualSlug', () => {
  it('lowercases, dashes runs outside [a-z0-9], trims dashes and appends the id hash', () => {
    expect(visualSlug('src/Payments')).toBe(`src-payments-${h6('src/Payments')}`);
    expect(visualSlug('(root)')).toBe(`root-${h6('(root)')}`);
    expect(visualSlug('lib#2')).toBe(`lib-2-${h6('lib#2')}`);
    expect(visualSlug('--a__b--')).toBe(`a-b-${h6('--a__b--')}`);
  });

  it('never collides on ids that dash the same way', () => {
    expect(visualSlug('a/b')).not.toBe(visualSlug('a-b'));
    expect(visualSlug('a/b').startsWith('a-b-')).toBe(true);
  });

  it('is always a safe file name, even with nothing left of the id', () => {
    for (const id of ['日本', '../..', '</script>', '']) expect(visualSlug(id)).toMatch(/^[a-z0-9][a-z0-9-]*$/);
  });
});

const sb = (over: Partial<Storyboard> = {}): Storyboard => ({
  zone: 'src/pay',
  trigger: { label: 'User clicks Pay', ref: 'web/page.ts:1' },
  journey: [
    { label: 'page', zone: 'web', ref: 'web/page.ts:1', target: false },
    { label: 'pay', zone: 'src/pay', ref: 'src/pay/a.ts:1', target: true, role: 'charges' },
  ],
  outcome: null,
  steps: [{ label: 'a', ref: 'src/pay/a.ts:1' }, { label: 'b', ref: 'src/pay/b.ts:1' }, { label: 'c', ref: 'src/pay/a.ts:2' }],
  gotcha: { label: 'g', ref: 'docs/x.md:1' },
  ...over,
});

function repo(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'umap-vs-'));
  for (const [p, c] of Object.entries(files)) {
    mkdirSync(dirname(join(root, p)), { recursive: true });
    writeFileSync(join(root, p), c);
  }
  return root;
}

describe('visual fingerprint and cache', () => {
  const files = { 'src/pay/a.ts': 'a\nb\n', 'src/pay/b.ts': 'b\n', 'web/page.ts': 'p\n', 'docs/x.md': 'x\n' };
  const zone = { id: 'src/pay', files: ['src/pay/a.ts', 'src/pay/b.ts'] };

  it('hashes the zone files plus every file named by any ref', () => {
    const fp = visualFingerprint(repo(files), zone.files, sb());
    expect(Object.keys(fp).sort()).toEqual(['docs/x.md', 'src/pay/a.ts', 'src/pay/b.ts', 'web/page.ts']);
    expect(fp['web/page.ts']).toBe(createHash('sha1').update('p\n').digest('hex').slice(0, 12));
  });

  it('saves the storyboard with fingerprint and date next to the page, and reads it back', () => {
    const root = repo(files);
    const p = saveVisual(root, { zone: zone.id, date: '2026-11-12T00:00:00.000Z', fingerprint: visualFingerprint(root, zone.files, sb()), storyboard: sb() }, '<html></html>');
    expect(p.html).toBe(join(root, '.understanding', 'local', 'visuals', `${visualSlug('src/pay')}.html`));
    expect(p.json).toBe(p.html.replace(/\.html$/, '.json'));
    const saved = readSavedVisual(root, 'src/pay');
    expect(saved).toMatchObject({ zone: 'src/pay', date: '2026-11-12T00:00:00.000Z', storyboard: sb() });
    expect(readSavedVisual(root, 'src/other')).toBeNull();
  });

  it('is fresh until any zone file or any ref file changes, or the zone gains a file', () => {
    const root = repo(files);
    const save = () => saveVisual(root, { zone: zone.id, date: 'd', fingerprint: visualFingerprint(root, zone.files, sb()), storyboard: sb() }, '');
    save();
    const fresh = () => checkFresh(root, zone, readSavedVisual(root, zone.id)!);
    expect(fresh()).toEqual({ fresh: true });
    writeFileSync(join(root, 'docs/x.md'), 'changed\n');
    expect(fresh()).toMatchObject({ fresh: false });
    save();
    writeFileSync(join(root, 'src/pay/b.ts'), 'changed\n');
    expect(fresh().fresh).toBe(false);
    save();
    expect(checkFresh(root, { ...zone, files: [...zone.files, 'src/pay/c.ts'] }, readSavedVisual(root, zone.id)!).fresh).toBe(false);
  });

  it('reads a malformed saved file as null', () => {
    const root = repo(files);
    mkdirSync(join(root, '.understanding', 'local', 'visuals'), { recursive: true });
    writeFileSync(join(root, '.understanding', 'local', 'visuals', `${visualSlug('src/pay')}.json`), '{"zone":"src/pay"}');
    expect(readSavedVisual(root, 'src/pay')).toBeNull();
  });
});
