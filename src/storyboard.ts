import { readFileSync, realpathSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

export const LABEL_MAX = 40;
export const ROLE_MAX = 90;
export const JOURNEY_MIN = 2;
export const JOURNEY_MAX = 6;
export const STEPS_MIN = 3;
export const STEPS_MAX = 7;

export interface Labelled { label: string; ref: string }
export interface JourneyStop { label: string; zone: string; ref: string; target: boolean; role?: string }
/** A verified storyboard (design §6.2). Only these fields survive validation; everything else is dropped. */
export interface Storyboard {
  zone: string;
  trigger: Labelled | null;
  journey: JourneyStop[] | null;
  outcome: { label: string } | null;
  steps: Labelled[];
  gotcha: Labelled | null;
}

export interface StoryboardContext {
  /** The zone being visualised. */
  zone: string;
  /** Every zone on the current map: id → files. */
  zones: Record<string, string[]>;
  /** Line count of a repository file, or null when it is missing, not a file, or outside the repository. */
  lineCount: (path: string) => number | null;
}

export class StoryboardError extends Error {
  constructor(public field: string, message: string) {
    super(`${field}: ${message}`);
    this.name = 'StoryboardError';
  }
}

const fail = (field: string, message: string): never => { throw new StoryboardError(field, message); };
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const chars = (s: string) => [...s].length;
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001f\u007f\u2028\u2029]/;

function text(v: unknown, field: string, max: number): string {
  if (typeof v !== 'string') return fail(field, 'must be a string');
  const s = v.trim();
  if (!s) return fail(field, 'must not be empty');
  if (CONTROL.test(s)) return fail(field, 'must be one line of plain text');
  if (chars(s) > max) return fail(field, `is ${chars(s)} characters; the limit is ${max}`);
  return s;
}

/** Splits `path:line`; the path must be repository-relative, with no `..` and no backslashes. */
export function parseRef(ref: string): { path: string; line: number } | null {
  const m = /^(.+):([1-9]\d*)$/.exec(ref);
  if (!m) return null;
  const path = m[1].replace(/^\.\//, '');
  if (path.startsWith('/') || /^[A-Za-z]:/.test(path) || path.includes('\\')) return null;
  if (path.split('/').some((s) => s === '..' || s === '.' || s === '')) return null;
  return { path, line: Number(m[2]) };
}

function ref(v: unknown, field: string, ctx: StoryboardContext, within?: { zone: string; files: string[] }): string {
  if (typeof v !== 'string') return fail(field, 'must be a "path:line" string');
  const r = parseRef(v.trim());
  if (!r) return fail(field, `"${v}" must be "path:line" with a repository-relative path and a line from 1`);
  const n = ctx.lineCount(r.path);
  if (n === null) return fail(field, `${r.path} is not a file in the repository`);
  if (r.line > n) return fail(field, `line ${r.line} is past the end of ${r.path} (${n} lines)`);
  if (within && !within.files.includes(r.path)) return fail(field, `${r.path} is not in zone ${within.zone}`);
  return `${r.path}:${r.line}`;
}

function optional(v: unknown, field: string): Record<string, unknown> | null {
  if (v === undefined || v === null) return null;
  return isObj(v) ? v : fail(field, 'must be an object or null');
}

function journey(v: unknown, ctx: StoryboardContext): JourneyStop[] | null {
  if (v === undefined || v === null) return null;
  if (!Array.isArray(v) || v.length < JOURNEY_MIN || v.length > JOURNEY_MAX) {
    return fail('journey', `must have ${JOURNEY_MIN}–${JOURNEY_MAX} stops (or be left out)`);
  }
  const targets = v.filter((s) => isObj(s) && s.target === true).length;
  if (targets !== 1) return fail('journey', `needs exactly one stop with "target": true (found ${targets})`);
  return v.map((s, i) => {
    const f = `journey[${i}]`;
    if (!isObj(s)) return fail(f, 'must be an object');
    if (s.target !== undefined && typeof s.target !== 'boolean') fail(`${f}.target`, 'must be true or false');
    const target = s.target === true;
    const label = text(s.label, `${f}.label`, LABEL_MAX);
    if (typeof s.zone !== 'string' || !Object.hasOwn(ctx.zones, s.zone)) {
      return fail(`${f}.zone`, `"${String(s.zone)}" is not a zone on the map`);
    }
    if (target && s.zone !== ctx.zone) return fail(`${f}.zone`, `the target stop must be the visualised zone ${ctx.zone}`);
    const stop: JourneyStop = { label, zone: s.zone, ref: ref(s.ref, `${f}.ref`, ctx, { zone: s.zone, files: ctx.zones[s.zone] }), target };
    if (target) stop.role = text(s.role, `${f}.role`, ROLE_MAX);
    return stop;
  });
}

/** Checks a model-written storyboard against the schema, the limits and the repository. Throws StoryboardError. */
export function validateStoryboard(raw: unknown, ctx: StoryboardContext): Storyboard {
  if (!isObj(raw)) return fail('storyboard', 'must be a JSON object');
  if (raw.zone !== ctx.zone) return fail('zone', `must be "${ctx.zone}"`);
  const trig = optional(raw.trigger, 'trigger');
  const trigger = trig && { label: text(trig.label, 'trigger.label', LABEL_MAX), ref: ref(trig.ref, 'trigger.ref', ctx) };
  const stops = journey(raw.journey, ctx);
  const out = optional(raw.outcome, 'outcome');
  const outcome = out && { label: text(out.label, 'outcome.label', LABEL_MAX) };
  if (!Array.isArray(raw.steps) || raw.steps.length < STEPS_MIN || raw.steps.length > STEPS_MAX) {
    return fail('steps', `must have ${STEPS_MIN}–${STEPS_MAX} steps`);
  }
  const zone = { zone: ctx.zone, files: ctx.zones[ctx.zone] ?? [] };
  const steps = raw.steps.map((s, i) => {
    if (!isObj(s)) return fail(`steps[${i}]`, 'must be an object');
    return { label: text(s.label, `steps[${i}].label`, LABEL_MAX), ref: ref(s.ref, `steps[${i}].ref`, ctx, zone) };
  });
  const g = optional(raw.gotcha, 'gotcha');
  const gotcha = g && { label: text(g.label, 'gotcha.label', LABEL_MAX), ref: ref(g.ref, 'gotcha.ref', ctx) };
  return { zone: ctx.zone, trigger, journey: stops, outcome, steps, gotcha };
}

/** Every file a storyboard names in any ref, sorted and unique. */
export function refFiles(s: Storyboard): string[] {
  const refs = [s.trigger?.ref, ...(s.journey ?? []).map((j) => j.ref), ...s.steps.map((x) => x.ref), s.gotcha?.ref];
  return [...new Set(refs.flatMap((r) => (r ? [parseRef(r)?.path ?? ''] : [])).filter(Boolean))].sort();
}

/** Line counter for files inside `root` (symlinks resolved; nothing outside the root or under .git). */
export function repoLineCounter(root: string): (path: string) => number | null {
  let base: string;
  try { base = realpathSync(root); } catch { return () => null; }
  return (path) => {
    if (!parseRef(`${path}:1`) || path === '.git' || path.startsWith('.git/')) return null;
    try {
      const full = realpathSync(join(base, path));
      if (!full.startsWith(base + sep) || full.slice(base.length + 1).split(sep)[0] === '.git') return null;
      if (!statSync(full).isFile()) return null;
      const lines = readFileSync(full, 'utf8').split('\n');
      return lines[lines.length - 1] === '' ? lines.length - 1 : lines.length;
    } catch {
      return null;
    }
  };
}
