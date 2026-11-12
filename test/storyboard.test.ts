import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { refFiles, repoLineCounter, StoryboardError, validateStoryboard, type StoryboardContext } from '../src/storyboard';

const FILES: Record<string, number> = {
  'web/pages/checkout.tsx': 80, 'src/api/checkout.ts': 40, 'src/payments/charge.ts': 60, 'src/payments/stripe.ts': 90,
  'src/payments/ledger.ts': 50, 'src/email/receipt.ts': 20, 'README.md': 10,
};
const ctx: StoryboardContext = {
  zone: 'src/payments',
  zones: {
    'web/pages': ['web/pages/checkout.tsx'], 'src/api': ['src/api/checkout.ts'],
    'src/payments': ['src/payments/charge.ts', 'src/payments/ledger.ts', 'src/payments/stripe.ts'],
    'src/email': ['src/email/receipt.ts'], '(root)': ['README.md'],
  },
  lineCount: (p) => FILES[p] ?? null,
};

interface Stop { label: string; zone: string; ref: string; target?: boolean; role?: string }
const good = () => ({
  zone: 'src/payments',
  trigger: { label: 'User clicks Pay', ref: 'web/pages/checkout.tsx:41' },
  journey: [
    { label: 'checkout page', zone: 'web/pages', ref: 'web/pages/checkout.tsx:41' },
    { label: 'checkout API', zone: 'src/api', ref: 'src/api/checkout.ts:12' },
    { label: 'payments', zone: 'src/payments', ref: 'src/payments/charge.ts:22', target: true, role: 'charges the card, retries on timeout, records the result' },
    { label: 'receipt email', zone: 'src/email', ref: 'src/email/receipt.ts:8' },
  ] as Stop[],
  outcome: { label: 'Receipt sent' },
  steps: [
    { label: 'build the charge', ref: 'src/payments/charge.ts:22' },
    { label: 'send to Stripe', ref: 'src/payments/stripe.ts:48' },
    { label: 'retry on timeout', ref: 'src/payments/stripe.ts:61' },
    { label: 'write ledger entry', ref: 'src/payments/ledger.ts:15' },
  ],
  gotcha: { label: 'Refunds of 0 skip the ledger', ref: 'src/payments/ledger.ts:40' },
});
type SB = ReturnType<typeof good> & Record<string, unknown>;

function fieldOf(mut: (s: SB) => void): string {
  const s = good() as SB;
  mut(s);
  try {
    validateStoryboard(s, ctx);
  } catch (e) {
    expect(e).toBeInstanceOf(StoryboardError);
    return (e as StoryboardError).field;
  }
  throw new Error('expected a StoryboardError');
}

describe('validateStoryboard', () => {
  it('accepts the design example and returns only known fields', () => {
    const s = { ...good(), extra: '<script>' };
    const v = validateStoryboard(s, ctx);
    expect(v.zone).toBe('src/payments');
    expect(v.journey).toHaveLength(4);
    expect(v.journey![2]).toMatchObject({ target: true, role: 'charges the card, retries on timeout, records the result' });
    expect(v.journey![0].target).toBe(false);
    expect(v.steps).toHaveLength(4);
    expect('extra' in v).toBe(false);
  });

  it('allows a null trigger, no gotcha, no outcome and no journey', () => {
    const v = validateStoryboard({ ...good(), trigger: null, gotcha: undefined, outcome: undefined, journey: undefined }, ctx);
    expect(v.trigger).toBeNull();
    expect(v.gotcha).toBeNull();
    expect(v.outcome).toBeNull();
    expect(v.journey).toBeNull();
  });

  it.each<[string, (s: SB) => void]>([
    ['zone', (s) => { s.zone = 'src/api'; }],
    ['trigger.label', (s) => { s.trigger.label = 'x'.repeat(41); }],
    ['trigger.ref', (s) => { s.trigger.ref = 'nope.ts:1'; }],
    ['journey', (s) => { s.journey = s.journey.slice(0, 1); }],
    ['journey', (s) => { s.journey = [...s.journey, ...s.journey.slice(0, 3)].map((j) => ({ ...j, target: false })); }],
    ['journey', (s) => { s.journey[0] = { ...s.journey[0], target: true }; }],
    ['journey', (s) => { s.journey[2] = { ...s.journey[2], target: false }; }],
    ['journey[2].zone', (s) => { s.journey[2] = { ...s.journey[2], zone: 'src/api', ref: 'src/api/checkout.ts:1' }; }],
    ['journey[1].zone', (s) => { s.journey[1].zone = 'src/ghost'; }],
    ['journey[1].ref', (s) => { s.journey[1].ref = 'src/payments/charge.ts:3'; }],
    ['journey[2].role', (s) => { s.journey[2] = { ...s.journey[2], role: 'r'.repeat(91) }; }],
    ['journey[2].role', (s) => { delete s.journey[2].role; }],
    ['journey[3].label', (s) => { s.journey[3].label = '  '; }],
    ['outcome.label', (s) => { s.outcome = { label: 'o'.repeat(41) }; }],
    ['steps', (s) => { s.steps = s.steps.slice(0, 2); }],
    ['steps', (s) => { s.steps = [...s.steps, ...s.steps]; }],
    ['steps[1].ref', (s) => { s.steps[1].ref = 'src/api/checkout.ts:3'; }],
    ['steps[0].ref', (s) => { s.steps[0].ref = 'src/payments/charge.ts:61'; }],
    ['steps[0].ref', (s) => { s.steps[0].ref = 'src/payments/charge.ts:0'; }],
    ['steps[0].ref', (s) => { s.steps[0].ref = 'src/payments/charge.ts'; }],
    ['steps[0].ref', (s) => { s.steps[0].ref = '../etc/passwd:1'; }],
    ['steps[0].ref', (s) => { s.steps[0].ref = '/etc/passwd:1'; }],
    ['steps[2].label', (s) => { s.steps[2].label = 'two\nlines'; }],
    ['steps[2].label', (s) => { (s.steps[2] as { label: unknown }).label = 42; }],
    ['gotcha.ref', (s) => { s.gotcha.ref = 'README.md:11'; }],
  ])('names %s', (field, mut) => {
    expect(fieldOf(mut)).toBe(field);
  });

  it('lets the trigger and gotcha point anywhere in the repo, but steps only inside the zone', () => {
    expect(() => validateStoryboard({ ...good(), trigger: { label: 'Reads docs', ref: 'README.md:3' }, gotcha: { label: 'g', ref: 'README.md:10' } }, ctx)).not.toThrow();
  });

  it('counts characters, not UTF-16 units, toward the 40 limit', () => {
    expect(() => validateStoryboard({ ...good(), outcome: { label: '😀'.repeat(40) } }, ctx)).not.toThrow();
  });

  it('rejects a non-object storyboard', () => {
    expect(() => validateStoryboard([], ctx)).toThrow(StoryboardError);
  });

  it('error messages start with the field name', () => {
    try {
      validateStoryboard({ ...good(), steps: [] }, ctx);
    } catch (e) {
      expect((e as Error).message).toMatch(/^steps: /);
    }
  });
});

describe('refFiles', () => {
  it('lists every file named by any ref, once', () => {
    const v = validateStoryboard(good(), ctx);
    expect(refFiles(v)).toEqual(['src/api/checkout.ts', 'src/email/receipt.ts', 'src/payments/charge.ts', 'src/payments/ledger.ts', 'src/payments/stripe.ts', 'web/pages/checkout.tsx']);
  });
});

describe('repoLineCounter', () => {
  it('counts lines of files inside the repo only', () => {
    const root = mkdtempSync(join(tmpdir(), 'umap-sb-'));
    const outside = mkdtempSync(join(tmpdir(), 'umap-out-'));
    writeFileSync(join(outside, 'secret.txt'), 'a\nb\n');
    mkdirSync(join(root, 'src'));
    writeFileSync(join(root, 'src', 'a.ts'), 'one\ntwo\nthree\n');
    writeFileSync(join(root, 'src', 'b.ts'), 'one\ntwo');
    mkdirSync(join(root, '.git'));
    writeFileSync(join(root, '.git', 'config'), 'x\n');
    symlinkSync(join(outside, 'secret.txt'), join(root, 'src', 'link.txt'));
    const count = repoLineCounter(root);
    expect(count('src/a.ts')).toBe(3);
    expect(count('src/b.ts')).toBe(2);
    expect(count('src')).toBeNull();
    expect(count('src/missing.ts')).toBeNull();
    expect(count('src/link.txt')).toBeNull();
    expect(count('.git/config')).toBeNull();
    expect(count('../x')).toBeNull();
  });
});
