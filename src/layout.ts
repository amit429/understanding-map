/**
 * Deterministic geometry for the visualize page (design 9a.1). Every box, pill and text block gets a position and a
 * size here, in stage units, from an estimate of text width by character. Labels wrap to at most two lines and are
 * never cut short; a label that cannot fit at the smallest allowed size is a FitError naming its storyboard field.
 */

export const WIDE = 1280;
export const NARROW = 375;

export interface Rect { x: number; y: number; w: number; h: number }
export interface Point { x: number; y: number }
/** Wrapped text inside the rect [x, y, w, h]; `align` is horizontal ("middle" centres each line in w). */
export interface TextBlock extends Rect { lines: string[]; size: number; lh: number; mono: boolean; bold: boolean; align: 'start' | 'middle' }
export interface Pill { rect: Rect; text: TextBlock }

export interface LayoutInput {
  headings: { why: string; journey: string; inside: string; outro: string };
  zoneId: string;
  stateLabel: string;
  reason: string;
  dependents: string;
  journey: null | {
    start: { label: string; field: string };
    stops: Array<{ label: string; field: string; target: boolean }>;
    outcome: null | { label: string; field: string };
    role: { text: string; field: string };
    roleRef: string;
  };
  insideTitle: string;
  steps: Array<{ label: string; ref: string; field: string }>;
  gotcha: null | { title: string; label: string; ref: string; field: string };
  closing: string;
}

export interface JourneyLayout {
  heading: TextBlock;
  start: Pill;
  outcome: Pill | null;
  boxes: Array<{ rect: Rect; label: TextBlock; target: boolean }>;
  /** Arrow segments, which are also the dot's path: start pill → first box, box → box, last box → outcome pill. */
  arrows: Array<[Point, Point]>;
  role: TextBlock;
  roleRef: Pill;
  /** A dashed link from the target box down to its role caption (wide only: on narrow, other boxes sit below it). */
  roleLink: [Point, Point] | null;
  target: Rect;
}
export interface StepRow { rect: Rect; num: { cx: number; cy: number; r: number; size: number }; label: TextBlock; chip: Pill }
export interface Layout {
  width: number;
  height: number;
  why: { heading: TextBlock; zone: TextBlock; badge: Pill; reason: TextBlock; dependents: TextBlock };
  journey: JourneyLayout | null;
  inside: { heading: TextBlock; title: TextBlock; rows: StepRow[] };
  outro: { heading: TextBlock; gotcha: null | { rect: Rect; title: TextBlock; label: TextBlock; chip: Pill }; closing: TextBlock };
}

export class FitError extends Error {
  constructor(public field: string, message: string) {
    super(`${field}: ${message}`);
    this.name = 'FitError';
  }
}

// ---- text measurement -------------------------------------------------------------------------------------------

const BOLD = 1.06;
const MONO_EM = 0.62;
const NARROW_CH = new Set([...'ijl.,:;\'!|`']);
const SEMI_CH = new Set([...'frt()[]{}/\\-"*']);
const WIDE_LOWER = new Set([...'mw']);
const WIDE_UPPER = new Set([...'MW@%&']);

/** Width of one character in em, deliberately on the wide side for system sans-serif fonts. */
function charEm(ch: string, mono: boolean): number {
  const cp = ch.codePointAt(0)!;
  if (cp >= 0x1100) return 1.1; // CJK, emoji and other wide glyphs
  if (mono) return MONO_EM;
  if (ch === ' ') return 0.32;
  if (NARROW_CH.has(ch)) return 0.3;
  if (SEMI_CH.has(ch)) return 0.42;
  if (WIDE_UPPER.has(ch)) return 0.98;
  if (WIDE_LOWER.has(ch)) return 0.9;
  if (ch >= 'A' && ch <= 'Z') return 0.74;
  if (ch >= 'a' && ch <= 'z') return 0.6;
  if (ch >= '0' && ch <= '9') return 0.62;
  return cp > 0x7f ? 0.7 : 0.62;
}

export interface TextStyle { size: number; mono?: boolean; bold?: boolean }

/** Estimated rendered width in stage units. */
export function measure(s: string, st: TextStyle): number {
  let em = 0;
  for (const ch of s) em += charEm(ch, !!st.mono);
  return em * st.size * (st.bold ? BOLD : 1);
}

/** Splits one word wider than `maxW` into pieces, preferring breaks after "/", ":", "-", "_" or ".". */
function breakWord(word: string, maxW: number, st: TextStyle): string[] {
  const out: string[] = [];
  let rest = [...word];
  while (rest.length) {
    let n = 0;
    while (n < rest.length && measure(rest.slice(0, n + 1).join(''), st) <= maxW) n++;
    if (n === 0) n = 1; // a single glyph wider than the line: still never dropped
    if (n < rest.length) {
      const piece = rest.slice(0, n);
      let at = -1;
      for (let i = piece.length - 1; i > 0; i--) if ('/:-_.'.includes(piece[i])) { at = i; break; }
      if (at >= Math.floor(n / 2)) n = at + 1;
    }
    out.push(rest.slice(0, n).join(''));
    rest = rest.slice(n);
  }
  return out;
}

/** Greedy wrap at spaces; words longer than a line are broken. Never drops or elides a character. */
export function wrap(text: string, maxW: number, st: TextStyle): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const joined = cur ? `${cur} ${w}` : w;
    if (measure(joined, st) <= maxW) { cur = joined; continue; }
    if (cur) lines.push(cur);
    cur = '';
    if (measure(w, st) <= maxW) { cur = w; continue; }
    const pieces = breakWord(w, maxW, st);
    lines.push(...pieces.slice(0, -1));
    cur = pieces[pieces.length - 1];
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

const LH = 1.3;

function block(text: string, x: number, y: number, w: number, st: TextStyle, align: TextBlock['align'], lines?: string[]): TextBlock {
  const ls = lines ?? wrap(text, w, st);
  const lh = Math.round(st.size * LH * 10) / 10;
  return { x, y, w, h: ls.length * lh, lines: ls, size: st.size, lh, mono: !!st.mono, bold: !!st.bold, align };
}

/** The largest size at which every text fits in `maxLines` lines of width `w`; null when even the smallest fails. */
function sharedSize(texts: string[], w: number, sizes: number[], maxLines: number, st: Omit<TextStyle, 'size'>): number | null {
  for (const size of sizes) if (texts.every((t) => wrap(t, w, { ...st, size }).length <= maxLines)) return size;
  return null;
}

function fitOrFail(items: Array<{ text: string; field: string }>, w: number, sizes: number[], maxLines: number, st: Omit<TextStyle, 'size'>, what: string): number {
  const size = sharedSize(items.map((i) => i.text), w, sizes, maxLines, st);
  if (size !== null) return size;
  const bad = items.find((i) => wrap(i.text, w, { ...st, size: sizes[sizes.length - 1] }).length > maxLines)!;
  throw new FitError(bad.field, `is too wide to fit ${what} in ${maxLines} line${maxLines > 1 ? 's' : ''}; shorten it`);
}

function pill(text: string, cx: number, y: number, maxTextW: number, st: TextStyle, padX: number, padY: number, bounds: [number, number], lines?: string[]): Pill {
  const ls = lines ?? wrap(text, maxTextW, st);
  const tw = Math.max(...ls.map((l) => measure(l, st)));
  const w = Math.min(Math.max(tw + 2 * padX, 64), maxTextW + 2 * padX);
  const x = Math.min(Math.max(cx - w / 2, bounds[0]), bounds[1] - w);
  const t = block(text, x + padX, y + padY, w - 2 * padX, st, 'middle', ls);
  return { rect: { x, y, w, h: t.h + 2 * padY }, text: t };
}

const bottom = (r: Rect) => r.y + r.h;
const cxOf = (r: Rect) => r.x + r.w / 2;
const cyOf = (r: Rect) => r.y + r.h / 2;

// ---- geometry per width ----------------------------------------------------------------------------------------

interface Metrics {
  M: number; headingY: number; heading: number;
  zone: number; badge: number; body: number; whyTop: number;
  labelSizes: number[]; pillSizes: number[]; roleSizes: number[]; roleLines: number; chip: number;
  stepSizes: number[]; insideTitle: number; gotchaSizes: number[]; closing: number;
  boxPadX: number; boxPadY: number; minHeight: number;
}

const METRICS: Record<'wide' | 'narrow', Metrics> = {
  wide: {
    M: 32, headingY: 24, heading: 16, zone: 44, badge: 18, body: 24, whyTop: 150,
    labelSizes: [16, 15, 14, 13, 12], pillSizes: [15, 14, 13, 12], roleSizes: [20, 19, 18, 17, 16, 15], roleLines: 3, chip: 14,
    stepSizes: [19, 18, 17, 16, 15], insideTitle: 24, gotchaSizes: [20, 19, 18, 17, 16], closing: 20,
    boxPadX: 10, boxPadY: 12, minHeight: 720,
  },
  narrow: {
    M: 12, headingY: 14, heading: 14, zone: 26, badge: 15, body: 17, whyTop: 84,
    labelSizes: [14, 13, 12, 11], pillSizes: [14, 13, 12, 11], roleSizes: [15, 14, 13, 12], roleLines: 4, chip: 12,
    stepSizes: [16, 15, 14, 13], insideTitle: 17, gotchaSizes: [16, 15, 14, 13], closing: 15,
    boxPadX: 8, boxPadY: 10, minHeight: 640,
  },
};

function layoutJourney(j: NonNullable<LayoutInput['journey']>, heading: TextBlock, W: number, m: Metrics, narrow: boolean): JourneyLayout {
  const n = j.stops.length;
  const rowW = W - 2 * m.M;
  // Wide: boxes up to 200 units, and arrows as long as the row allows (36–80), so the travelling dot stays visible.
  const boxW = narrow ? (rowW - 28) / 2 : Math.min(200, (rowW - (n - 1) * 36) / n);
  const gap = narrow ? 28 : Math.min(80, (rowW - n * boxW) / (n - 1));
  const textW = boxW - 2 * m.boxPadX;
  const labelSize = fitOrFail(j.stops.map((s) => ({ text: s.label, field: s.field })), textW, m.labelSizes, 2, { bold: true }, 'in its box');
  const lst: TextStyle = { size: labelSize, bold: true };
  const lh = Math.round(labelSize * LH * 10) / 10;
  const boxH = 2 * lh + 2 * m.boxPadY;

  const pillPadX = 14;
  const pillPadY = 8;
  const pillTextMax = narrow ? rowW - 2 * pillPadX : Math.min(320, (rowW - 24) / 2 - 2 * pillPadX);
  const pillItems = [{ text: j.start.label, field: j.start.field }, ...(j.outcome ? [{ text: j.outcome.label, field: j.outcome.field }] : [])];
  const pillSize = fitOrFail(pillItems, pillTextMax, m.pillSizes, 2, {}, 'in its pill');
  const pst: TextStyle = { size: pillSize };

  const pillsTop = bottom(heading) + (narrow ? 22 : 96);
  const rowX0 = narrow ? m.M : (W - (n * boxW + (n - 1) * gap)) / 2;
  const slot = (i: number) => {
    if (!narrow) return { col: i, row: 0 };
    const row = Math.floor(i / 2);
    const inRow = i % 2;
    return { col: row % 2 === 0 ? inRow : 1 - inRow, row };
  };
  const firstCx = rowX0 + slot(0).col * (boxW + gap) + boxW / 2;
  const startBounds: [number, number] = narrow ? [m.M, W - m.M] : [m.M, W / 2 - 12];
  const start = pill(j.start.label, firstCx, pillsTop, pillTextMax, pst, pillPadX, pillPadY, startBounds);

  let outcome: Pill | null = null;
  const lastSlot = slot(n - 1);
  const lastCx = rowX0 + lastSlot.col * (boxW + gap) + boxW / 2;
  if (j.outcome && !narrow) outcome = pill(j.outcome.label, lastCx, pillsTop, pillTextMax, pst, pillPadX, pillPadY, [W / 2 + 12, W - m.M]);
  const bandBottom = Math.max(bottom(start.rect), outcome ? bottom(outcome.rect) : 0);
  const rowTop = bandBottom + (narrow ? 32 : 44);

  const boxes = j.stops.map((s, i) => {
    const { col, row } = slot(i);
    const rect = { x: rowX0 + col * (boxW + gap), y: rowTop + row * (boxH + 36), w: boxW, h: boxH };
    const lines = wrap(s.label, textW, lst);
    const th = lines.length * lh;
    const label = block(s.label, rect.x + m.boxPadX, rect.y + (boxH - th) / 2, textW, lst, 'middle', lines);
    return { rect, label, target: s.target };
  });
  const gridBottom = Math.max(...boxes.map((b) => bottom(b.rect)));
  if (j.outcome && narrow) {
    outcome = pill(j.outcome.label, lastCx, gridBottom + 32, pillTextMax, pst, pillPadX, pillPadY, [m.M, W - m.M]);
  }

  const arrows: Array<[Point, Point]> = [];
  const b0 = boxes[0].rect;
  const ax = Math.min(Math.max(cxOf(b0), start.rect.x + pillPadX), start.rect.x + start.rect.w - pillPadX);
  arrows.push([{ x: ax, y: bottom(start.rect) + 4 }, { x: ax, y: b0.y - 4 }]);
  for (let i = 1; i < n; i++) {
    const a = boxes[i - 1].rect;
    const b = boxes[i].rect;
    if (a.y === b.y) {
      const leftToRight = a.x < b.x;
      arrows.push([{ x: leftToRight ? a.x + a.w + 4 : a.x - 4, y: cyOf(a) }, { x: leftToRight ? b.x - 4 : b.x + b.w + 4, y: cyOf(b) }]);
    } else {
      arrows.push([{ x: cxOf(a), y: bottom(a) + 4 }, { x: cxOf(b), y: b.y - 4 }]);
    }
  }
  const last = boxes[n - 1].rect;
  if (outcome) {
    const ox = Math.min(Math.max(cxOf(last), outcome.rect.x + pillPadX), outcome.rect.x + outcome.rect.w - pillPadX);
    arrows.push(narrow
      ? [{ x: ox, y: bottom(last) + 4 }, { x: ox, y: outcome.rect.y - 4 }]
      : [{ x: ox, y: last.y - 4 }, { x: ox, y: bottom(outcome.rect) + 4 }]);
  }

  const below = Math.max(gridBottom, outcome ? bottom(outcome.rect) : 0);
  const roleW = Math.min(880, rowW);
  const roleSize = fitOrFail([{ text: j.role.text, field: j.role.field }], roleW, m.roleSizes, m.roleLines, {}, 'under the journey');
  const role = block(j.role.text, (W - roleW) / 2, below + (narrow ? 28 : 40), roleW, { size: roleSize }, 'middle');
  const chipSt: TextStyle = { size: m.chip, mono: true };
  const roleRef = pill(j.roleRef, W / 2, bottom(role) + 12, roleW - 20, chipSt, 10, 5, [m.M, W - m.M]);
  const target = boxes.find((b) => b.target)!.rect;
  const roleLink: [Point, Point] | null = narrow ? null : [{ x: cxOf(target), y: bottom(target) + 4 }, { x: cxOf(target), y: role.y - 6 }];
  return { heading, start, outcome, boxes, arrows, role, roleRef, roleLink, target };
}

function layoutAt(input: LayoutInput, W: number): Layout {
  const narrow = W < 640;
  const m = METRICS[narrow ? 'narrow' : 'wide'];
  const rowW = W - 2 * m.M;
  const head = (t: string) => block(t, m.M, m.headingY, rowW, { size: m.heading, bold: true }, 'start');
  const chipSt: TextStyle = { size: m.chip, mono: true };

  // Scene 1: why this matters (live map data, so it may wrap to any number of lines).
  const zone = block(input.zoneId, m.M, m.whyTop, rowW, { size: m.zone, mono: true, bold: true }, 'start');
  const badgeSt: TextStyle = { size: m.badge, bold: true };
  const bw = measure(input.stateLabel, badgeSt) + 28;
  const badgeText = block(input.stateLabel, m.M + 14, bottom(zone) + 24 + 6, bw - 28, badgeSt, 'middle', [input.stateLabel]);
  const badge = { rect: { x: m.M, y: bottom(zone) + 24, w: bw, h: badgeText.h + 12 }, text: badgeText };
  const reason = block(input.reason, m.M, bottom(badge.rect) + 24, rowW, { size: m.body }, 'start');
  const dependents = block(input.dependents, m.M, bottom(reason) + 14, rowW, { size: m.body, bold: true }, 'start');
  const why = { heading: head(input.headings.why), zone, badge, reason, dependents };

  // Scene 2: product journey.
  const journey = input.journey ? layoutJourney(input.journey, head(input.headings.journey), W, m, narrow) : null;

  // Scene 3: inside the zone.
  const iHeading = head(input.headings.inside);
  const title = block(input.insideTitle, m.M, bottom(iHeading) + (narrow ? 18 : 30), rowW, { size: m.insideTitle, mono: true, bold: true }, 'start');
  const numR = narrow ? 12 : 15;
  const labelX = m.M + (narrow ? 34 : 52);
  const labelW = narrow ? W - m.M - labelX : 520;
  const stepSize = fitOrFail(input.steps.map((s) => ({ text: s.label, field: s.field })), labelW, m.stepSizes, 2, { bold: true }, 'in its step');
  const sst: TextStyle = { size: stepSize, bold: true };
  const chipX = narrow ? labelX : labelX + labelW + 24;
  const chipMaxText = W - m.M - chipX - 20;
  let y = bottom(title) + (narrow ? 20 : 28);
  const pad = narrow ? 8 : 10;
  const rows: StepRow[] = input.steps.map((s) => {
    const label = block(s.label, labelX, y + pad, labelW, sst, 'start');
    const chipTop = narrow ? bottom(label) + 6 : y + pad;
    const chip = pill(s.ref, chipX, chipTop, chipMaxText, chipSt, 10, 4, [chipX, W - m.M]);
    chip.rect.x = chipX; // left-aligned in its column
    chip.text.x = chipX + 10;
    const h = (narrow ? bottom(chip.rect) - y : Math.max(label.h, chip.rect.h)) + pad * (narrow ? 1 : 2);
    const rect = { x: m.M, y, w: rowW, h };
    y += h + (narrow ? 10 : 12);
    // Narrow: the number sits beside the label's first line; wide: centred on the row.
    const cy = narrow ? label.y + label.lh / 2 : rect.y + h / 2;
    return { rect, num: { cx: m.M + numR + 2, cy, r: numR, size: narrow ? 12 : 14 }, label, chip };
  });
  const inside = { heading: iHeading, title, rows };

  // Scene 4: back out, the gotcha and the closing line.
  const oHeading = head(input.headings.outro);
  const outTop = journey ? Math.max(...journey.boxes.map((b) => bottom(b.rect)), journey.outcome ? bottom(journey.outcome.rect) : 0) + (narrow ? 28 : 40)
    : bottom(oHeading) + (narrow ? 40 : 96);
  let gotcha: Layout['outro']['gotcha'] = null;
  let closingTop = outTop;
  if (input.gotcha) {
    const cardW = Math.min(760, rowW);
    const cx0 = (W - cardW) / 2;
    const inner = cardW - 40;
    const t = block(input.gotcha.title, cx0 + 20, outTop + 16, inner, { size: narrow ? 13 : 14, bold: true }, 'start');
    const gSize = fitOrFail([{ text: input.gotcha.label, field: input.gotcha.field }], inner, m.gotchaSizes, 2, {}, 'in the watch-out note');
    const label = block(input.gotcha.label, cx0 + 20, bottom(t) + 6, inner, { size: gSize }, 'start');
    const chip = pill(input.gotcha.ref, cx0 + 20, bottom(label) + 10, inner - 20, chipSt, 10, 4, [cx0 + 20, cx0 + cardW - 20]);
    chip.rect.x = cx0 + 20;
    chip.text.x = cx0 + 30;
    const rect = { x: cx0, y: outTop, w: cardW, h: bottom(chip.rect) + 16 - outTop };
    gotcha = { rect, title: t, label, chip };
    closingTop = bottom(rect) + (narrow ? 24 : 36);
  }
  const closing = block(input.closing, m.M, closingTop, rowW, { size: m.closing, bold: true }, 'middle');
  const outro = { heading: oHeading, gotcha, closing };

  const ends = [
    bottom(dependents),
    bottom(closing),
    ...(journey ? [bottom(journey.roleRef.rect)] : []),
    ...rows.map((r) => bottom(r.rect)),
  ];
  const height = Math.ceil(Math.max(m.minHeight, Math.max(...ends) + (narrow ? 28 : 40)));
  return { width: W, height, why, journey, inside, outro };
}

/** Lays out every scene at one stage width (WIDE or NARROW). Throws FitError when a label cannot fit. */
export function layoutVisual(input: LayoutInput, width: number): Layout {
  return layoutAt(input, width);
}

/** The first label that cannot fit at either width, or null. */
export function fitError(input: LayoutInput): FitError | null {
  try {
    layoutAt(input, WIDE);
    layoutAt(input, NARROW);
    return null;
  } catch (e) {
    if (e instanceof FitError) return e;
    throw e;
  }
}

/** Everything drawn at the same time in each scene, as named rectangles (for overlap and bounds checks). */
export function sceneRects(l: Layout): Record<'why' | 'journey' | 'inside' | 'outro', Array<{ name: string; rect: Rect; within?: Rect; text?: TextBlock }>> {
  const t = (name: string, b: TextBlock, within?: Rect) => ({ name, rect: b as Rect, within, text: b });
  const journeyRow = (j: JourneyLayout) => [
    { name: 'start', rect: j.start.rect }, t('start.text', j.start.text, j.start.rect),
    ...(j.outcome ? [{ name: 'outcome', rect: j.outcome.rect }, t('outcome.text', j.outcome.text, j.outcome.rect)] : []),
    ...j.boxes.flatMap((b, i) => [{ name: `box${i}`, rect: b.rect }, t(`box${i}.label`, b.label, b.rect)]),
  ];
  const j = l.journey;
  return {
    why: [t('heading', l.why.heading), t('zone', l.why.zone), { name: 'badge', rect: l.why.badge.rect }, t('badge.text', l.why.badge.text, l.why.badge.rect),
      t('reason', l.why.reason), t('dependents', l.why.dependents)],
    journey: j ? [t('heading', j.heading), ...journeyRow(j), t('role', j.role), { name: 'roleRef', rect: j.roleRef.rect }, t('roleRef.text', j.roleRef.text, j.roleRef.rect)] : [],
    inside: [t('heading', l.inside.heading), t('title', l.inside.title),
      ...l.inside.rows.flatMap((r, i) => [{ name: `row${i}`, rect: r.rect }, t(`row${i}.label`, r.label, r.rect),
        { name: `row${i}.chip`, rect: r.chip.rect, within: r.rect }, t(`row${i}.chip.text`, r.chip.text, r.chip.rect)])],
    outro: [t('heading', l.outro.heading), ...(j ? journeyRow(j) : []),
      ...(l.outro.gotcha ? [{ name: 'gotcha', rect: l.outro.gotcha.rect }, t('gotcha.title', l.outro.gotcha.title, l.outro.gotcha.rect),
        t('gotcha.label', l.outro.gotcha.label, l.outro.gotcha.rect), { name: 'gotcha.chip', rect: l.outro.gotcha.chip.rect, within: l.outro.gotcha.rect },
        t('gotcha.chip.text', l.outro.gotcha.chip.text, l.outro.gotcha.chip.rect)] : []),
      t('closing', l.outro.closing)],
  };
}
