import { esc, safeJson } from './html.js';
import { fitError, layoutVisual, NARROW, WIDE, type Layout, type LayoutInput, type Pill, type Point, type Rect, type TextBlock } from './layout.js';
import { StoryboardError, validateStoryboard, type Storyboard, type StoryboardContext } from './storyboard.js';
import type { ZoneState } from './types.js';
import { VISUAL_TEMPLATE } from './visual-template.js';

/** Scene-1 data, read from the live map at render time (design 9a.3). Nothing about people, levels or agent share. */
export interface LiveZone { id: string; state: ZoneState; reason: string; fanIn: number }

export type SceneId = 'why' | 'journey' | 'inside' | 'outro';
const TITLES: Record<SceneId, string> = { why: 'Why this matters', journey: 'Product journey', inside: 'Inside the zone', outro: 'Back out' };
const STATES: ZoneState[] = ['owned', 'fragile', 'fading', 'dark', 'unknown'];

export const learnCommand = (zoneId: string) => `/understanding-map:learn ${zoneId}`;
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function sceneIds(sb: Storyboard): SceneId[] {
  return sb.journey ? ['why', 'journey', 'inside', 'outro'] : ['why', 'inside', 'outro'];
}

/** The layout's input for a storyboard and the live zone data. */
export function layoutInputFor(sb: Storyboard, z: LiveZone): LayoutInput {
  const ids = sceneIds(sb);
  const heading = (id: SceneId) => `${ids.indexOf(id) + 1} · ${TITLES[id]}`;
  const t = sb.journey ? sb.journey.findIndex((s) => s.target) : -1;
  return {
    headings: { why: heading('why'), journey: sb.journey ? heading('journey') : '', inside: heading('inside'), outro: heading('outro') },
    zoneId: z.id,
    stateLabel: cap(z.state),
    reason: z.reason,
    dependents: z.fanIn > 0 ? `${plural(z.fanIn, 'file depends', 'files depend')} on it` : 'No other files import it',
    journey: sb.journey && {
      start: sb.trigger ? { label: sb.trigger.label, field: 'trigger.label' } : { label: 'Called by', field: 'trigger' },
      stops: sb.journey.map((s, i) => ({ label: s.label, field: `journey[${i}].label`, target: s.target })),
      outcome: sb.outcome && { label: sb.outcome.label, field: 'outcome.label' },
      role: { text: sb.journey[t].role ?? '', field: `journey[${t}].role` },
      roleRef: sb.journey[t].ref,
    },
    insideTitle: `Inside ${z.id}`,
    steps: sb.steps.map((s, i) => ({ label: s.label, ref: s.ref, field: `steps[${i}].label` })),
    gotcha: sb.gotcha && { title: 'Watch out', label: sb.gotcha.label, ref: sb.gotcha.ref, field: 'gotcha.label' },
    closing: `Lock it in: ${learnCommand(z.id)}`,
  };
}

/** Validates a storyboard (schema, limits, repository) and checks every label fits the layout. Throws StoryboardError. */
export function checkStoryboard(raw: unknown, ctx: StoryboardContext): Storyboard {
  const sb = validateStoryboard(raw, ctx);
  // Scene-1 text wraps freely, so placeholder data is enough to check the storyboard's own labels.
  const fit = fitError(layoutInputFor(sb, { id: ctx.zone, state: 'unknown', reason: '', fanIn: 0 }));
  if (fit) throw new StoryboardError(fit.field, fit.message.slice(fit.field.length + 2));
  return sb;
}

// ---- timeline ---------------------------------------------------------------------------------------------------

const ZOOM = 1.2;
const HOP = 1.3;
const PAUSE = 0.5;
const TARGET_HOLD = 2.5;
const STEP = 3.6;

interface Timeline {
  scenes: Array<{ id: SceneId; title: string; duration: number }>;
  why: { zone: number; badge: number; reason: number; dependents: number };
  journey: null | { start: number; boxes: number[]; outcome: number; hops: Array<[number, number]>; visits: Array<[number, number]>; reach: number; role: number };
  steps: Array<[number, number]>;
  outro: { gotcha: number; closing: number };
}

export function timeline(sb: Storyboard): Timeline {
  const why = { zone: 0.3, badge: 1.2, reason: 2, dependents: 3.2 };
  let journey: Timeline['journey'] = null;
  let journeyDur = 0;
  if (sb.journey) {
    const n = sb.journey.length;
    const boxes = sb.journey.map((_, i) => 0.8 + 0.3 * i);
    const outcome = 0.8 + 0.3 * n;
    // One hop per arrow: hop k ends at box k, and the last one at the outcome pill when there is one.
    const arrows = n + (sb.outcome ? 1 : 0);
    const targetIndex = sb.journey.findIndex((s) => s.target);
    const hops: Array<[number, number]> = [];
    let t = outcome + 0.8;
    let reach = 0;
    for (let k = 0; k < arrows; k++) {
      hops.push([t, t + HOP]);
      t += HOP;
      if (k === targetIndex) reach = t;
      t += k === targetIndex ? TARGET_HOLD : PAUSE;
    }
    const visits = boxes.map((_, k): [number, number] => [hops[k][1], k + 1 < arrows ? hops[k + 1][0] : 1e9]);
    journey = { start: 0.3, boxes, outcome, hops, visits, reach, role: reach + 0.3 };
    journeyDur = Math.max(14, Math.round((t + 3) * 10) / 10);
  }
  const steps = sb.steps.map((_, i): [number, number] => [1.6 + i * STEP, i === sb.steps.length - 1 ? 1e9 : 1.6 + (i + 1) * STEP]);
  const insideDur = Math.round((1.6 + sb.steps.length * STEP + 2) * 10) / 10;
  const outro = { gotcha: 1.4, closing: sb.gotcha ? 3.4 : 1.6 };
  const durations: Record<SceneId, number> = { why: 9, journey: journeyDur, inside: insideDur, outro: outro.closing + 5 };
  const ids = sceneIds(sb);
  return {
    scenes: ids.map((id, i) => ({ id, title: `${i + 1} · ${TITLES[id]}`, duration: durations[id] })),
    why, journey, steps, outro,
  };
}

// ---- SVG --------------------------------------------------------------------------------------------------------

const n2 = (v: number) => String(Math.round(v * 100) / 100);
const attrs = (a: Record<string, string | number | undefined>) =>
  Object.entries(a).flatMap(([k, v]) => (v === undefined ? [] : [` ${k}="${esc(typeof v === 'number' ? n2(v) : v)}"`])).join('');

function text(b: TextBlock, cls: string, extra: Record<string, string | number | undefined> = {}): string {
  const x = b.align === 'middle' ? b.x + b.w / 2 : b.x;
  const spans = b.lines.map((l, i) => `<tspan${attrs({ x, y: b.y + i * b.lh + b.lh / 2 + b.size * 0.35 })}>${esc(l)}</tspan>`).join('');
  const classes = [cls, b.mono ? 'mono' : '', b.bold ? 'b' : ''].filter(Boolean).join(' ');
  return `<text${attrs({ class: classes, 'font-size': b.size, 'text-anchor': b.align === 'middle' ? 'middle' : 'start', ...extra })}>${spans}</text>`;
}
const rect = (r: Rect, cls: string, rx = 8) => `<rect${attrs({ class: cls, x: r.x, y: r.y, width: r.w, height: r.h, rx })}/>`;
const pillSvg = (p: Pill, cls: string) => rect(p.rect, `${cls}-bg`, Math.min(p.rect.h / 2, 18)) + text(p.text, `${cls}-t`);
const line = (a: Point, b: Point, cls: string, marker?: string) =>
  `<line${attrs({ class: cls, x1: a.x, y1: a.y, x2: b.x, y2: b.y, 'marker-end': marker ? `url(#${marker})` : undefined })}/>`;
/** An element that appears at `a` seconds into its layer's own scene. */
const g = (body: string, a: number, cls = '', extra: Record<string, string | number | undefined> = {}) =>
  `<g${attrs({ class: `el ${cls}`.trim(), 'data-a': a, ...extra })}>${body}</g>`;

function svg(l: Layout, tl: Timeline, state: ZoneState, variant: 'w' | 'n'): string {
  const marker = `ah-${variant}`;
  const full = `0 0 ${l.width} ${l.height}`;
  const parts: string[] = [];
  parts.push(`<defs><marker id="${marker}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="ah" d="M0,0 L10,5 L0,10 z"/></marker></defs>`);
  parts.push(`<rect class="stage-bg" x="0" y="0" width="${l.width}" height="${l.height}"/>`);

  const w = l.why;
  parts.push(`<g class="layer" data-layer="why">` +
    g(text(w.heading, 'h'), 0) +
    g(text(w.zone, 'zone'), tl.why.zone) +
    g(rect(w.badge.rect, `badge-bg st-${state}`, 6) + text(w.badge.text, `badge-t st-${state}`), tl.why.badge) +
    g(text(w.reason, 'body'), tl.why.reason) +
    g(text(w.dependents, 'body strong'), tl.why.dependents) +
    `</g>`);

  const j = l.journey;
  if (j && tl.journey) {
    const t = tl.journey;
    const items: string[] = [g(text(j.heading, 'h'), 0, 'home-only')];
    items.push(g(pillSvg(j.start, 'pill'), t.start));
    items.push(g(line(j.arrows[0][0], j.arrows[0][1], 'arrow', marker), t.boxes[0]));
    j.boxes.forEach((b, i) => {
      if (i > 0) items.push(g(line(j.arrows[i][0], j.arrows[i][1], 'arrow', marker), t.boxes[i]));
      const cls = b.target ? `box tgt st-${state}` : 'box';
      const lit = b.target ? { 'data-lit': `${n2(t.reach)} 1e9`, 'data-keep-lit': '1' } : { 'data-lit': `${n2(t.visits[i][0])} ${n2(t.visits[i][1])}` };
      items.push(g(rect(b.rect, 'box-bg') + text(b.label, 'box-t'), t.boxes[i], cls, lit));
    });
    if (j.outcome) {
      items.push(g(pillSvg(j.outcome, 'pill'), t.outcome, 'end', { 'data-lit': `${n2(t.hops[t.hops.length - 1][1])} 1e9`, 'data-keep-lit': '1' }));
      items.push(g(line(j.arrows[j.arrows.length - 1][0], j.arrows[j.arrows.length - 1][1], 'arrow', marker), t.outcome));
    }
    if (j.roleLink) items.push(g(line(j.roleLink[0], j.roleLink[1], 'link'), t.role, 'home-only'));
    items.push(g(text(j.role, 'role'), t.role, 'home-only'));
    items.push(g(pillSvg(j.roleRef, 'chip'), t.role + 0.4, 'home-only'));
    items.push(`<circle class="dot" r="${variant === 'w' ? 8 : 6}" cx="${n2(j.arrows[0][0].x)}" cy="${n2(j.arrows[0][0].y)}"/>`);
    parts.push(`<g class="layer" data-layer="journey">${items.join('')}</g>`);
  }

  const ins = l.inside;
  const rows = ins.rows.map((r, i) => {
    const [a, b] = tl.steps[i];
    return g(rect(r.rect, 'row-bg') +
      `<circle class="num-bg"${attrs({ cx: r.num.cx, cy: r.num.cy, r: r.num.r })}/>` +
      `<text${attrs({ class: 'num-t b', x: r.num.cx, y: r.num.cy + r.num.size * 0.35, 'font-size': r.num.size, 'text-anchor': 'middle' })}>${i + 1}</text>` +
      text(r.label, 'row-t') + pillSvg(r.chip, 'chip'), a, 'row', { 'data-lit': `${n2(a)} ${n2(b)}` });
  }).join('');
  parts.push(`<g class="layer" data-layer="inside"><rect class="inside-bg st-${state}" x="0" y="0" width="${l.width}" height="${l.height}"/>` +
    g(text(ins.heading, 'h'), 0) + g(text(ins.title, 'zone small'), 0.9) + rows + `</g>`);

  const o = l.outro;
  const gotcha = o.gotcha
    ? g(rect(o.gotcha.rect, 'gotcha-bg') + text(o.gotcha.title, 'gotcha-h') + text(o.gotcha.label, 'gotcha-t') + pillSvg(o.gotcha.chip, 'chip'), tl.outro.gotcha)
    : '';
  parts.push(`<g class="layer" data-layer="outro">` + g(text(o.heading, 'h'), 0) + gotcha + g(text(o.closing, 'closing'), tl.outro.closing) + `</g>`);

  const target = j ? j.target : null;
  const pad = 24;
  const zoomTo = target ? `${n2(target.x - pad)} ${n2(target.y - pad)} ${n2(target.w + 2 * pad)} ${n2(target.h + 2 * pad)}` : full;
  return `<svg class="v v-${variant}" viewBox="${full}" data-full="${full}" data-zoom="${zoomTo}" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">${parts.join('')}</svg>`;
}

// ---- captions (readable without playing) ------------------------------------------------------------------------

function captions(sb: Storyboard, z: LiveZone, input: LayoutInput, tl: Timeline): string {
  const ref = (r: string) => `<code>${esc(r)}</code>`;
  const items: string[] = [];
  for (const s of tl.scenes) {
    let body = '';
    if (s.id === 'why') {
      body = `<p><code>${esc(z.id)}</code> is <strong>${esc(cap(z.state))}</strong>. ${esc(z.reason)}. ${esc(input.dependents)}.</p>`;
    } else if (s.id === 'journey' && sb.journey) {
      const stops = sb.journey.map((j) => (j.target ? `<strong>${esc(j.label)}</strong>` : esc(j.label)) + ` (${ref(j.ref)})`);
      const start = sb.trigger ? `${esc(sb.trigger.label)} (${ref(sb.trigger.ref)})` : 'Called by';
      const chain = [start, ...stops, ...(sb.outcome ? [esc(sb.outcome.label)] : [])].join(' → ');
      const target = sb.journey.find((j) => j.target)!;
      body = `<p>${chain}</p><p>${esc(target.label)}: ${esc(target.role ?? '')}.</p>`;
    } else if (s.id === 'inside') {
      body = `<ol>${sb.steps.map((st) => `<li>${esc(st.label)} ${ref(st.ref)}</li>`).join('')}</ol>`;
    } else if (s.id === 'outro') {
      body = (sb.gotcha ? `<p>Watch out: ${esc(sb.gotcha.label)} ${ref(sb.gotcha.ref)}</p>` : '') +
        `<p>Lock it in: <code>${esc(learnCommand(z.id))}</code></p>`;
    }
    items.push(`<li><h3>${esc(s.title)}</h3>${body}</li>`);
  }
  return `<ol class="captions">${items.join('')}</ol>`;
}

/** Renders the self-contained page: two laid-out stages (1280 and 375 wide), captions, data and the player. */
export function renderVisual(sb: Storyboard, z: LiveZone, generatedAt: string): { html: string; scenes: SceneId[] } {
  const state: ZoneState = STATES.includes(z.state) ? z.state : 'unknown';
  const live = { ...z, state };
  const input = layoutInputFor(sb, live);
  const tl = timeline(sb);
  const wide = layoutVisual(input, WIDE);
  const narrow = layoutVisual(input, NARROW);
  const data = {
    version: 1,
    zone: z.id,
    zoom: ZOOM,
    scenes: tl.scenes,
    dot: tl.journey ? {
      hops: tl.journey.hops,
      w: wide.journey!.arrows.map(([a, b]) => [a.x, a.y, b.x, b.y].map((v) => Math.round(v * 10) / 10)),
      n: narrow.journey!.arrows.map(([a, b]) => [a.x, a.y, b.x, b.y].map((v) => Math.round(v * 10) / 10)),
    } : null,
    storyboard: sb,
  };
  const fill: Record<string, string> = {
    __TITLE__: esc(`${z.id} · Understanding Map`),
    __ZONE__: esc(z.id),
    __META__: esc(`Animation of one zone, drawn from a storyboard checked against the code · generated ${generatedAt}`),
    __STAGE__: svg(wide, tl, state, 'w') + svg(narrow, tl, state, 'n'),
    __CAPTIONS__: captions(sb, live, input, tl),
    __LEARN__: esc(learnCommand(z.id)),
    __DATA__: safeJson(data),
  };
  const html = VISUAL_TEMPLATE.replace(/__(TITLE|ZONE|META|STAGE|CAPTIONS|LEARN|DATA)__/g, (k) => fill[k]);
  return { html, scenes: tl.scenes.map((s) => s.id) };
}
