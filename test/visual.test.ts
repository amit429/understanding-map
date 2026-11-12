import { describe, expect, it } from 'vitest';
import { THEME_CSS } from '../src/report-template';
import { StoryboardError, type Storyboard, type StoryboardContext } from '../src/storyboard';
import { checkStoryboard, renderVisual, timeline, type LiveZone } from '../src/visual';
import { PLAYER_JS } from '../src/visual-template';

const sb = (over: Partial<Storyboard> = {}): Storyboard => ({
  zone: 'src/payments',
  trigger: { label: 'User clicks Pay', ref: 'web/pages/checkout.tsx:41' },
  journey: [
    { label: 'checkout page', zone: 'web/pages', ref: 'web/pages/checkout.tsx:41', target: false },
    { label: 'checkout API', zone: 'src/api', ref: 'src/api/checkout.ts:12', target: false },
    { label: 'payments', zone: 'src/payments', ref: 'src/payments/charge.ts:22', target: true, role: 'charges the card, retries on timeout, records the result' },
    { label: 'receipt email', zone: 'src/email', ref: 'src/email/receipt.ts:8', target: false },
  ],
  outcome: { label: 'Receipt sent' },
  steps: [
    { label: 'build the charge', ref: 'src/payments/charge.ts:22' },
    { label: 'send to Stripe', ref: 'src/payments/stripe.ts:48' },
    { label: 'retry on timeout', ref: 'src/payments/stripe.ts:61' },
    { label: 'write ledger entry', ref: 'src/payments/ledger.ts:15' },
  ],
  gotcha: { label: 'Refunds of 0 skip the ledger', ref: 'src/payments/ledger.ts:40' },
  ...over,
});
const live: LiveZone = { id: 'src/payments', state: 'dark', reason: 'Dark · 14 files import it · tagged critical', fanIn: 14 };
const data = (html: string) => JSON.parse(html.match(/<script type="application\/json" id="umap-data">([\s\S]*?)<\/script>/)![1]);

describe('renderVisual', () => {
  it('draws four scenes with a journey: why, journey, inside, back out, ending with the learn command', () => {
    const r = renderVisual(sb(), live, '2026-11-12');
    expect(r.scenes).toEqual(['why', 'journey', 'inside', 'outro']);
    expect(r.html).toContain('data-layer="journey"');
    expect(r.html).toContain('Lock it in: /understanding-map:learn src/payments');
    expect(r.html.match(/<svg class="v v-/g)).toHaveLength(2);
    expect(r.html).toContain('viewBox="0 0 1280 ');
    expect(r.html).toContain('viewBox="0 0 375 ');
    for (const s of [...sb().steps.map((x) => x.ref), 'Dark', 'Watch out']) expect(r.html).toContain(s);
    const d = data(r.html);
    expect(d.scenes.map((s: { id: string }) => s.id)).toEqual(r.scenes);
    expect(d.dot.w).toHaveLength(5);
    expect(d.dot.hops).toHaveLength(5);
    expect(d.dot.w[0]).toHaveLength(4);
    expect(d.storyboard).toEqual(sb());
  });

  it('draws three scenes without a journey, and "Called by" when there is no trigger', () => {
    const r = renderVisual(sb({ journey: null, trigger: null, outcome: null }), live, 'd');
    expect(r.scenes).toEqual(['why', 'inside', 'outro']);
    expect(r.html).not.toContain('data-layer="journey"');
    expect(data(r.html).dot).toBeNull();
    expect(r.html).toContain('1 · Why this matters');
    expect(r.html).toContain('2 · Inside the zone');
    expect(renderVisual(sb({ trigger: null }), live, 'd').html).toContain('Called by');
  });

  it('shows the state only on the target box; other boxes are neutral', () => {
    const html = renderVisual(sb(), live, 'd').html;
    expect(html.match(/class="el box tgt st-dark"/g)).toHaveLength(2);
    expect(html.match(/class="el box"/g)).toHaveLength(6);
  });

  it('is self-contained: no network, no external code, system fonts, the report tokens', () => {
    const html = renderVisual(sb(), live, 'd').html;
    expect(html).not.toMatch(/https?:\/\//);
    expect(html).not.toMatch(/<script[^>]+src=/i);
    expect(html).not.toMatch(/<link\b/i);
    expect(html).not.toContain('@import');
    expect(html).not.toContain('@font-face');
    expect(html).not.toMatch(/url\(\s*["']?(https?:|\/\/|data:)/i);
    expect(html).toContain(THEME_CSS);
    expect(html).toMatch(/prefers-color-scheme:\s*dark/);
    expect(html).toContain('name="viewport"');
  });

  it('respects prefers-reduced-motion and keeps the player small', () => {
    const html = renderVisual(sb(), live, 'd').html;
    expect(html).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(PLAYER_JS).toContain("matchMedia('(prefers-reduced-motion: reduce)')");
    for (const id of ['restart', 'prev', 'play', 'next', 'speed']) expect(html).toContain(`id="${id}"`);
    expect(Buffer.byteLength(PLAYER_JS)).toBeLessThanOrEqual(10 * 1024);
    expect(() => new Function(PLAYER_JS)).not.toThrow();
  });

  it('escapes hostile zone ids and labels in markup and JSON', () => {
    const evil = '</script><b>x';
    const hostile = sb({
      zone: evil,
      trigger: { label: '<img src=x onerror=alert(1)>', ref: 'a.ts:1' },
      steps: [{ label: '</script><i>s', ref: 'a.ts:1' }, { label: '"quoted" & <u>', ref: 'a.ts:2' }, { label: "it's", ref: 'a.ts:3' }],
      gotcha: { label: '<script>alert(1)</script>', ref: 'a.ts:4' },
    });
    hostile.journey![2].zone = evil;
    hostile.journey![2].role = '<b>role</b>';
    const html = renderVisual(hostile, { ...live, id: evil, reason: '<b>r' }, '<b>d').html;
    for (const tag of ['<b>', '<i>', '<u>', '<img', '<script>alert']) expect(html).not.toContain(tag);
    expect(html.match(/<\/script>/g)).toHaveLength(2);
    expect(html.match(/<script/g)).toHaveLength(2);
    const d = data(html);
    expect(d.zone).toBe(evil);
    expect(d.storyboard.gotcha.label).toBe('<script>alert(1)</script>');
    expect(html).toContain('&lt;/script&gt;&lt;b&gt;x');
  });

  it('never draws people, levels or agent share, whatever the zone object carries', () => {
    const z = { ...live, people: [{ handle: 'priya', level: 8761 }], agentShare: 0.7391, danger: 55 } as unknown as LiveZone;
    const html = renderVisual(sb(), z, 'd').html;
    for (const s of ['priya', '8761', '74%', '0.7391', 'agent']) expect(html).not.toContain(s);
  });
});

describe('camera data', () => {
  it('gives each scene its own height and zoom boxes with that scene\'s aspect ratio', () => {
    const d = data(renderVisual(sb(), live, 'd').html);
    for (const v of ['w', 'n'] as const) {
      const c = d.cam[v];
      expect(c.w).toBe(v === 'w' ? 1280 : 375);
      for (const id of ['why', 'journey', 'inside', 'outro']) expect(c.h[id]).toBeGreaterThan(100);
      expect(c.zin[2] / c.zin[3]).toBeCloseTo(c.w / c.h.inside, 3);
      expect(c.zout[2] / c.zout[3]).toBeCloseTo(c.w / c.h.outro, 3);
    }
    const html = renderVisual(sb(), live, 'd').html;
    expect(html).toContain(`viewBox="0 0 1280 ${d.cam.w.h.why}"`);
  });
});

describe('scene 1', () => {
  const whyText = (html: string) => {
    const svg = html.slice(html.indexOf('<svg class="v v-w"'));
    const layer = svg.slice(svg.indexOf('data-layer="why"'), svg.indexOf('data-layer="journey"'));
    return [...layer.matchAll(/<tspan[^>]*>([^<]*)<\/tspan>/g)].map((m) => m[1]).join(' ');
  };
  it('says the state once (the badge), then the reason without the state word', () => {
    const t = whyText(renderVisual(sb(), live, 'd').html);
    expect(t.match(/Dark/g)).toHaveLength(1);
    expect(t).toContain('14 files import it');
    expect(t).not.toContain('depend on it');
  });
  it('says so when nothing imports the zone', () => {
    const t = whyText(renderVisual(sb(), { ...live, state: 'fading', reason: 'Fading', fanIn: 0 }, 'd').html);
    expect(t).toContain('No other files import it');
    expect(t.match(/Fading/g)).toHaveLength(1);
  });
});

describe('stage classes', () => {
  it('every class drawn on the stage is styled or is a known player hook', () => {
    const html = renderVisual(sb(), live, 'd').html;
    const css = html.slice(html.indexOf('<style>'), html.indexOf('</style>'));
    const stage = html.slice(html.indexOf('<div class="stage"'), html.indexOf('<div class="controls"'));
    const used = new Set([...stage.matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].split(' ')));
    const hooks = new Set(['el', 'home-only', 'end', 'zone', 'small', 'body', 'role', 'gotcha-h', 'gotcha-t', 'pill-t', 'box-t', 'chip-t', 'row-t', 'num-t', 'layer', 'stage']);
    const unstyled = [...used].filter((c) => !hooks.has(c) && !new RegExp(`\\.${c.replace(/[^a-z0-9-]/g, '')}\\b`).test(css));
    expect(unstyled).toEqual([]);
  });
});

describe('timeline', () => {
  it('hops the dot through every stop, lights the target on arrival and steps in order', () => {
    const tl = timeline(sb());
    expect(tl.journey!.hops).toHaveLength(5);
    expect(tl.journey!.reach).toBe(tl.journey!.hops[2][1]);
    tl.journey!.visits.forEach(([a, b], k) => {
      expect(a).toBe(tl.journey!.hops[k][1]);
      expect(b).toBeGreaterThan(a);
    });
    for (let i = 1; i < tl.steps.length; i++) expect(tl.steps[i][0]).toBe(tl.steps[i - 1][1]);
    const total = tl.scenes.reduce((s, x) => s + x.duration, 0);
    expect(total).toBeGreaterThan(40);
    expect(total).toBeLessThan(100);
    for (const s of tl.scenes) expect(s.duration).toBeGreaterThan(5);
  });
});

describe('timings follow the design (scene table, §2)', () => {
  for (const stops of [2, 3, 4, 5, 6]) {
    for (const steps of [3, 4, 5, 6, 7]) {
      it(`${stops} stops, ${steps} steps`, () => {
        for (const outcome of [true, false]) {
          const journey = Array.from({ length: stops }, (_, i) => ({ label: `s${i}`, zone: `z${i}`, ref: `a.ts:${i + 1}`, target: i === stops - 1, ...(i === stops - 1 ? { role: 'r' } : {}) }));
          const story = sb({ journey, outcome: outcome ? { label: 'done' } : null, steps: Array.from({ length: steps }, (_, i) => ({ label: `x${i}`, ref: `a.ts:${i + 1}` })) });
          const d = Object.fromEntries(timeline(story).scenes.map((x) => [x.id, x.duration]));
          expect(d.why).toBe(10);
          expect(d.journey).toBeGreaterThanOrEqual(20);
          expect(d.journey).toBeLessThanOrEqual(30);
          expect(d.inside).toBeGreaterThanOrEqual(25);
          expect(d.inside).toBeLessThanOrEqual(40);
          expect(d.outro).toBe(10);
          const total = d.why + d.journey + d.inside + d.outro;
          expect(total).toBeGreaterThanOrEqual(60);
          expect(total).toBeLessThanOrEqual(90);
        }
      });
    }
  }
});

describe('checkStoryboard', () => {
  const ctx: StoryboardContext = {
    zone: 'src/payments',
    zones: { 'web/pages': ['web/pages/checkout.tsx'], 'src/api': ['src/api/checkout.ts'], 'src/email': ['src/email/receipt.ts'],
      'src/payments': ['src/payments/charge.ts', 'src/payments/stripe.ts', 'src/payments/ledger.ts'] },
    lineCount: () => 100,
  };
  it('passes a storyboard whose labels fit', () => {
    expect(checkStoryboard(sb(), ctx)).toEqual(sb());
  });
  it('turns a label too wide to draw into a StoryboardError naming the field', () => {
    const s = sb();
    s.steps[1].label = 'W'.repeat(40);
    s.journey![1].label = 'W'.repeat(40);
    try {
      checkStoryboard(s, ctx);
      throw new Error('expected an error');
    } catch (e) {
      expect(e).toBeInstanceOf(StoryboardError);
      expect((e as StoryboardError).field).toBe('journey[1].label');
      expect((e as Error).message).toMatch(/^journey\[1\]\.label: is too wide/);
    }
  });
});
