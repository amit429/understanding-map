import { describe, expect, it } from 'vitest';
import { fitError, FitError, layoutVisual, measure, NARROW, sceneRects, WIDE, wrap, type Layout, type LayoutInput, type Rect, type TextBlock } from '../src/layout';

const exactly = (s: string, n = 40) => (s.repeat(Math.ceil(n / s.length))).slice(0, n).replace(/\s+$/, (m) => 'x'.repeat(m.length));
const LABELS = [
  exactly('validates the webhook signature then acks it '),
  exactly('internationalisationMiddlewareRegistryX'),
  exactly('Sends a POST to the Stripe API (v2) once '),
  exactly('reads config, merges defaults, checks it'),
  exactly('src/payments/charge.ts builds the charge'),
  exactly('retry with backoff on 429 and 5xx errors'),
  exactly('writes the ledger entry and emits event '),
];
const ROLE = exactly('charges the card, retries on timeout, records the result and emits a receipt event ok', 90);
const REF = 'src/payments/very/deeply/nested/folder/structure/charge-handler.ts:1234';

function input(stops: number | null, steps: number, opts: { gotcha?: boolean; outcome?: boolean; zoneId?: string; reason?: string } = {}): LayoutInput {
  const zoneId = opts.zoneId ?? 'src/payments';
  return {
    headings: { why: '1 · Why this matters', journey: '2 · Product journey', inside: '3 · Inside the zone', outro: '4 · Back out' },
    zoneId,
    stateLabel: 'Fading',
    reason: opts.reason ?? '14 files import it · 6 fixes in the last 90 days · tagged critical',
    journey: stops === null ? null : {
      start: { label: LABELS[2], field: 'trigger.label' },
      stops: Array.from({ length: stops }, (_, i) => ({ label: LABELS[i % LABELS.length], field: `journey[${i}].label`, target: i === Math.floor(stops / 2) })),
      outcome: opts.outcome === false ? null : { label: LABELS[5], field: 'outcome.label' },
      role: { text: ROLE, field: `journey[${Math.floor(stops / 2)}].role` },
      roleRef: REF,
    },
    insideTitle: `Inside ${zoneId}`,
    steps: Array.from({ length: steps }, (_, i) => ({ label: LABELS[(i + 3) % LABELS.length], ref: i % 2 ? REF : 'src/payments/a.ts:7', field: `steps[${i}].label` })),
    gotcha: opts.gotcha === false ? null : { title: 'Watch out', label: LABELS[1], ref: REF, field: 'gotcha.label' },
    closing: `Lock it in: /understanding-map:learn ${zoneId}`,
  };
}

const EPS = 0.01;
const inside = (a: Rect, b: Rect) => a.x >= b.x - EPS && a.y >= b.y - EPS && a.x + a.w <= b.x + b.w + EPS && a.y + a.h <= b.y + b.h + EPS;
const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w - EPS && b.x < a.x + a.w - EPS && a.y < b.y + b.h - EPS && b.y < a.y + a.h - EPS;
const squash = (s: string) => s.replace(/\s+/g, '');

function textOk(t: TextBlock, original?: string) {
  for (const line of t.lines) expect(measure(line, t), `"${line}" overflows ${t.w}`).toBeLessThanOrEqual(t.w + EPS);
  expect(t.lines.length * t.lh).toBeLessThanOrEqual(t.h + EPS);
  expect(t.lines.join('')).not.toContain('…');
  if (original !== undefined) expect(squash(t.lines.join(''))).toBe(squash(original));
}

function checkLayout(l: Layout, inp: LayoutInput) {
  const stage = { x: 0, y: 0, w: l.width, h: l.height };
  for (const [scene, items] of Object.entries(sceneRects(l))) {
    for (const it of items) {
      expect(inside(it.rect, stage), `${scene}/${it.name} leaves the stage`).toBe(true);
      if (it.within) expect(inside(it.rect, it.within), `${scene}/${it.name} leaves its container`).toBe(true);
      if (it.text) textOk(it.text);
    }
    for (let i = 0; i < items.length; i++) {
      for (let k = i + 1; k < items.length; k++) {
        const a = items[i];
        const b = items[k];
        if (b.name.startsWith(`${a.name}.`) || a.name.startsWith(`${b.name}.`)) continue; // a text inside its own box
        expect(overlaps(a.rect, b.rect), `${scene}: ${a.name} overlaps ${b.name}`).toBe(false);
      }
    }
  }
  // Labels: at most two lines, nothing dropped.
  const j = l.journey;
  if (j && inp.journey) {
    j.boxes.forEach((b, i) => {
      expect(b.label.lines.length).toBeLessThanOrEqual(2);
      textOk(b.label, inp.journey!.stops[i].label);
    });
    textOk(j.start.text, inp.journey.start.label);
    if (inp.journey.outcome) textOk(j.outcome!.text, inp.journey.outcome.label);
    textOk(j.role, inp.journey.role.text);
    textOk(j.roleRef.text, inp.journey.roleRef);
    for (const [p, q] of j.arrows) {
      for (const b of j.boxes) {
        for (const pt of [p, q]) expect(pt.x > b.rect.x && pt.x < b.rect.x + b.rect.w && pt.y > b.rect.y && pt.y < b.rect.y + b.rect.h).toBe(false);
      }
    }
    expect(j.arrows).toHaveLength(inp.journey.stops.length + (inp.journey.outcome ? 1 : 0));
    for (const [p, q] of j.arrows.slice(1, inp.journey.stops.length)) expect(Math.hypot(q.x - p.x, q.y - p.y)).toBeGreaterThanOrEqual(20);
    expect(j.target).toBe(j.boxes.find((b) => b.target)!.rect);
    if (j.roleLink) {
      const [p, q] = j.roleLink;
      const seg = { x: p.x - 1, y: p.y, w: 2, h: q.y - p.y };
      expect(seg.h).toBeGreaterThan(0);
      const others = [...j.boxes.map((b) => b.rect), j.start.rect, ...(j.outcome ? [j.outcome.rect] : []), j.roleRef.rect];
      for (const r of others) expect(overlaps(seg, r), 'the role link crosses another element').toBe(false);
    }
  }
  l.inside.rows.forEach((r, i) => {
    const circle = { x: r.num.cx - r.num.r, y: r.num.cy - r.num.r, w: 2 * r.num.r, h: 2 * r.num.r };
    expect(inside(circle, r.rect), `step ${i} number leaves its row`).toBe(true);
    expect(overlaps(circle, r.label) || overlaps(circle, r.chip.rect), `step ${i} number overlaps its text`).toBe(false);
    expect(r.label.lines.length).toBeLessThanOrEqual(2);
    textOk(r.label, inp.steps[i].label);
    textOk(r.chip.text, inp.steps[i].ref);
  });
  if (inp.gotcha) textOk(l.outro.gotcha!.label, inp.gotcha.label);
  textOk(l.outro.closing, inp.closing);
  textOk(l.why.zone, inp.zoneId);
  textOk(l.why.reason, inp.reason);
}

describe('layoutVisual', () => {
  for (const width of [WIDE, NARROW]) {
    for (const stops of [null, 2, 3, 4, 5, 6]) {
      for (const steps of [3, 4, 5, 6, 7]) {
        it(`no overlaps or overflow at ${width} px with ${stops ?? 'no'} journey stops and ${steps} steps`, () => {
          for (const opts of [{}, { gotcha: false }, { outcome: false }, { gotcha: false, outcome: false }]) {
            const inp = input(stops, steps, opts);
            checkLayout(layoutVisual(inp, width), inp);
          }
        });
      }
    }
  }

  it('wide puts the journey in one row; narrow uses two columns in a snake, one row per pair', () => {
    const w = layoutVisual(input(6, 3), WIDE).journey!;
    expect(new Set(w.boxes.map((b) => b.rect.y)).size).toBe(1);
    const n = layoutVisual(input(6, 3), NARROW).journey!;
    expect(new Set(n.boxes.map((b) => b.rect.x)).size).toBe(2);
    expect(new Set(n.boxes.map((b) => b.rect.y)).size).toBe(3);
    expect(n.boxes[2].rect.x).toBe(n.boxes[1].rect.x); // the snake turns down, not back to the left edge
    expect(new Set(layoutVisual(input(4, 3), NARROW).journey!.boxes.map((b) => b.rect.y)).size).toBe(2);
  });

  it('keeps a short state badge on one line', () => {
    for (const width of [WIDE, NARROW]) for (const s of ['Dark', 'Owned', 'Fading', 'Fragile', 'Unknown']) {
      expect(layoutVisual({ ...input(3, 3), stateLabel: s }, width).why.badge.text.lines).toEqual([s]);
    }
  });

  it('gives wide journeys of up to 4 stops long arrows for the dot', () => {
    for (const n of [2, 3, 4]) {
      const j = layoutVisual(input(n, 3), WIDE).journey!;
      for (const [p, q] of j.arrows.slice(1, n)) expect(q.x - p.x).toBeGreaterThanOrEqual(60);
    }
  });

  it('wraps a very long zone id and reason without overflow and grows the stage', () => {
    const zoneId = 'packages/' + Array.from({ length: 12 }, (_, i) => `segment-number-${i}`).join('/') + '#3';
    const reason = 'Dark · ' + Array.from({ length: 20 }, () => '123 files import it').join(' · ');
    for (const width of [WIDE, NARROW]) {
      const inp = input(4, 7, { zoneId, reason });
      const l = layoutVisual(inp, width);
      checkLayout(l, inp);
      expect(l.why.zone.lines.length).toBeGreaterThan(1);
    }
  });

  it('is deterministic', () => {
    expect(layoutVisual(input(5, 6), WIDE)).toEqual(layoutVisual(input(5, 6), WIDE));
    expect(layoutVisual(input(5, 6), NARROW)).toEqual(layoutVisual(input(5, 6), NARROW));
  });
});

describe('fitError', () => {
  it('is null for labels within the limits', () => {
    expect(fitError(input(6, 7))).toBeNull();
  });

  it('names the field of a label that cannot fit in two lines at the smallest size', () => {
    const inp = input(6, 3);
    inp.journey!.stops[4].label = 'W'.repeat(40);
    const e = fitError(inp);
    expect(e).toBeInstanceOf(FitError);
    expect(e!.field).toBe('journey[4].label');
    expect(() => layoutVisual(inp, WIDE)).toThrow(FitError);
  });
});

describe('text measurement', () => {
  it('estimates wide glyphs wider than narrow ones, mono at a fixed advance', () => {
    expect(measure('WWWW', { size: 10 })).toBeGreaterThan(measure('iiii', { size: 10 }));
    expect(measure('iiii', { size: 10, mono: true })).toBe(measure('WWWW', { size: 10, mono: true }));
    expect(measure('ab', { size: 10, bold: true })).toBeGreaterThan(measure('ab', { size: 10 }));
  });

  it('wraps at spaces, breaks only over-long words, and never drops a character', () => {
    expect(wrap('aa bb cc', 1000, { size: 10 })).toEqual(['aa bb cc']);
    const lines = wrap('src/very/long/path/to/a/file.ts:12', 60, { size: 10, mono: true });
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join('')).toBe('src/very/long/path/to/a/file.ts:12');
    for (const l of lines) expect(measure(l, { size: 10, mono: true })).toBeLessThanOrEqual(60);
  });
});
