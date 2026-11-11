import picomatch from 'picomatch';
import type {
  Commit, Config, Criticality, Evidence, Flag, MapResult, PassEvent, PersonLevel, Zone, ZoneResult, ZoneState,
} from './types.js';
import {
  AGENT_PENALTY, CRIT, DARK_AGENT_SHARE, DARKNESS, FIX_RE, HUMAN_BASE, HUMAN_SHARE_MAX, HUMAN_SHARE_MULT,
  REVIEW_MAX, REVIEW_PER,
} from './weights.js';

export interface ScoreInputs {
  config: Config; now: Date; me: string; handleOf: (email: string) => string;
  zones: Zone[]; commits: Commit[];
  agentLines: Map<string, Map<string, number>>;   // local knowledge (Task 5)
  sharedAgentShare: Record<string, number>;        // zone → 0..1, team mode only (pipeline computes it)
  fileLoc?: Record<string, number>;                // path → lines of code; weights pass fingerprint decay by lines
  passes: Map<string, PassEvent[]>; localPartials: PassEvent[];
  fanIn: Record<string, number>; reviews: Record<string, Record<string, number>>; flags: Record<string, Flag[]>;
}

const DAY = 86_400_000;
/** Window for churn and bug history; the reason text says "in the last 90 days". */
const RECENT_DAYS = 90;
const STATES: ZoneState[] = ['owned', 'fragile', 'fading', 'dark', 'unknown'];

interface Scored { level: number; evidence: Evidence[] }
/** One commit touching a zone: who, when, and the lines it added there (and how many were agent-written). */
interface Touch { handle: string; time: number; message: string; added: number; agent: number }

// ---- small helpers -------------------------------------------------------

const clamp = (n: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n));
const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const share = (v: unknown) => clamp(num(v), 0, 1);
const daysSince = (now: Date, t: number) => Math.max(0, (now.getTime() - t) / DAY);
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const pct = (s: number) => `${Math.max(1, Math.round(s * 100))}%`;
const ago = (days: number) => (days < 1 ? 'today' : `${plural(Math.floor(days), 'day', 'days')} ago`);

/** Half-life decay; no decay when halfLifeDays <= 0. */
const timeDecay = (days: number, halfLifeDays: number) => (halfLifeDays > 0 ? 0.5 ** (days / halfLifeDays) : 1);

function decayTimeEvidence(days: number, cfg: Config): Evidence {
  return { kind: 'decay-time', text: `evidence from ${ago(days)} counts for less (it halves every ${cfg.halfLifeDays} days)` };
}

/** Well-formed events only (string zone and date, finite level, parseable date), oldest first. */
function validEvents(evs: unknown): PassEvent[] {
  if (!Array.isArray(evs)) return [];
  return evs
    .filter((e): e is PassEvent => typeof e === 'object' && e !== null && typeof e.zone === 'string'
      && typeof e.date === 'string' && !Number.isNaN(Date.parse(e.date))
      && typeof e.level === 'number' && Number.isFinite(e.level))
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}

const latestFor = (zoneId: string, evs: unknown) => validEvents(evs).filter((e) => e.zone === zoneId).at(-1);

function zoneTouches(zone: Zone, inp: ScoreInputs): Touch[] {
  const inZone = new Set(zone.files);
  const out: Touch[] = [];
  for (const c of inp.commits) {
    const files = c.files.filter((f) => inZone.has(f.path));
    if (!files.length) continue;
    const agentByPath = inp.agentLines.get(c.sha);
    out.push({
      handle: inp.handleOf(c.email), time: c.date.getTime(), message: c.message,
      added: sum(files.map((f) => Math.max(0, f.added))),
      agent: sum(files.map((f) => clamp(num(agentByPath?.get(f.path)), 0, Math.max(0, f.added)))),
    });
  }
  return out;
}

// ---- understanding level per person --------------------------------------

/** Handle → time of their latest commit (anywhere in the repo) or pass. */
function activity(inp: ScoreInputs): Map<string, number> {
  const last = new Map<string, number>();
  const see = (h: string, t: number) => last.set(h, Math.max(t, last.get(h) ?? -Infinity));
  for (const c of inp.commits) see(inp.handleOf(c.email), c.date.getTime());
  for (const [h, evs] of inp.passes) for (const e of validEvents(evs)) see(h, Date.parse(e.date));
  return last;
}

/** Zone-level agent share: max(local agent lines ÷ lines added in the window, shared team share). */
function zoneAgentShare(zone: Zone, touches: Touch[], inp: ScoreInputs): number {
  const added = sum(touches.map((t) => t.added));
  const local = added > 0 ? sum(touches.map((t) => t.agent)) / added : 0;
  return Math.max(share(local), share(inp.sharedAgentShare[zone.id]));
}

/**
 * Everyone starts from their own agent lines (local knowledge, incl. public trailers/notes) ÷ their added lines.
 * In team mode, teammates (not `me`) also take the zone's shared share if it is higher.
 */
function personAgentFrac(handle: string, zone: Zone, mine: Touch[], inp: ScoreInputs): number {
  const added = sum(mine.map((t) => t.added));
  const own = added > 0 ? share(sum(mine.map((t) => t.agent)) / added) : 0;
  if (inp.config.mode === 'team' && handle !== inp.me) return Math.max(own, share(inp.sharedAgentShare[zone.id]));
  return own;
}

/**
 * (HUMAN_BASE + min(HUMAN_SHARE_MAX, HUMAN_SHARE_MULT × lines/loc) − AGENT_PENALTY × agentFrac)
 *   × max(0, 1 − othersAddedAfter/loc) × time decay, plus a capped review bonus.
 */
function historyLevel(handle: string, zone: Zone, touches: Touch[], inp: ScoreInputs): Scored | null {
  const mine = touches.filter((t) => t.handle === handle);
  const reviews = Math.max(0, num(inp.reviews[zone.id]?.[handle]));
  if (!mine.length && !reviews) return null;
  const evidence: Evidence[] = [];
  let level = 0;
  if (mine.length) {
    const lines = sum(mine.map((t) => t.added));
    const last = Math.max(...mine.map((t) => t.time));
    const days = daysSince(inp.now, last);
    evidence.push({ kind: 'human-commits', text: `added ~${lines} lines here; last commit ${ago(days)}` });

    const agentFrac = personAgentFrac(handle, zone, mine, inp);
    const zoneShare = zoneAgentShare(zone, touches, inp);
    // Only ever the zone-level share, never a person's own fraction. In team mode every teammate with
    // history here gets it, so the entry never singles out who used agents.
    const teammate = inp.config.mode === 'team' && handle !== inp.me;
    if (agentFrac > 0 || (teammate && zoneShare > 0)) {
      evidence.push({ kind: 'agent-share', text: `about ${pct(zoneShare)} of this zone was written by agents` });
    }
    const authorship = zone.loc > 0 ? Math.min(HUMAN_SHARE_MAX, (HUMAN_SHARE_MULT * lines) / zone.loc) : 0;
    const raw = Math.max(0, HUMAN_BASE + authorship - AGENT_PENALTY * agentFrac);

    const othersAfter = sum(touches.filter((t) => t.handle !== handle && t.time > last).map((t) => t.added));
    const changed = zone.loc > 0 ? Math.max(0, 1 - othersAfter / zone.loc) : 1;
    if (othersAfter > 0) evidence.push({ kind: 'decay-change', text: `others have added ~${othersAfter} lines here since` });

    const faded = timeDecay(days, inp.config.halfLifeDays);
    if (faded < 1) evidence.push(decayTimeEvidence(days, inp.config));
    level = raw * changed * faded;
  }
  if (reviews) {
    level += Math.min(REVIEW_MAX, REVIEW_PER * reviews);
    evidence.push({ kind: 'review', text: `reviewed ${plural(reviews, 'change', 'changes')} here` });
  }
  return { level, evidence };
}

/** Event level × share of the zone's files whose hash is unchanged since the event × time decay. */
function passLevel(ev: PassEvent, zone: Zone, inp: ScoreInputs, kind: 'pass' | 'partial'): Scored {
  // Weighted by lines of code when `fileLoc` is given (and non-empty for this zone), else by file count.
  const fp: Record<string, unknown> = typeof ev.fingerprint === 'object' && ev.fingerprint !== null ? ev.fingerprint : {};
  const byLines = inp.fileLoc !== undefined && zone.files.some((f) => num(inp.fileLoc?.[f]) > 0);
  const weight = (f: string) => (byLines ? Math.max(0, num(inp.fileLoc?.[f])) : 1);
  const total = sum(zone.files.map(weight));
  const same = sum(zone.files.filter((f) => fp[f] === zone.fingerprint[f]).map(weight));
  const unchanged = total > 0 ? same / total : 0;
  const days = daysSince(inp.now, Date.parse(ev.date));
  const faded = timeDecay(days, inp.config.halfLifeDays);
  const what = ev.kind === 'handoff' ? 'a handoff check' : 'a learning session';
  const evidence: Evidence[] = [kind === 'pass'
    ? { kind: 'pass', text: `passed ${what} here ${ago(days)}` }
    : { kind: 'partial', text: `partly passed ${what} here ${ago(days)}` }];
  if (unchanged < 1) evidence.push({ kind: 'decay-change', text: `about ${pct(1 - unchanged)} of its files have changed since` });
  if (faded < 1) evidence.push(decayTimeEvidence(days, inp.config));
  return { level: clamp(ev.level) * unchanged * faded, evidence };
}

const FLAG_TEXT: Record<Flag, string> = {
  'hard-to-verify': 'too unclear to quiz on yet (hard to verify)',
  'unreviewed-agent-code': 'has agent code that skipped a handoff check (unreviewed)',
};

const zoneFlags = (zone: Zone, inp: ScoreInputs): Flag[] =>
  (Array.isArray(inp.flags[zone.id]) ? inp.flags[zone.id] : []).filter((f) => f in FLAG_TEXT);

export function personLevels(zone: Zone, inp: ScoreInputs): PersonLevel[] {
  const touches = zoneTouches(zone, inp);
  const lastActive = activity(inp);
  const passes = new Map<string, PassEvent>();
  for (const [h, evs] of inp.passes) {
    const ev = latestFor(zone.id, evs);
    if (ev) passes.set(h, ev);
  }
  const partial = latestFor(zone.id, inp.localPartials);
  const handles = new Set([...touches.map((t) => t.handle), ...Object.keys(inp.reviews[zone.id] ?? {}), ...passes.keys()]);
  if (partial) handles.add(inp.me);

  const people: PersonLevel[] = [];
  for (const handle of handles) {
    const pass = passes.get(handle);
    const parts = [
      historyLevel(handle, zone, touches, inp),
      pass ? passLevel(pass, zone, inp, 'pass') : null,
      partial && handle === inp.me ? passLevel(partial, zone, inp, 'partial') : null,
    ].filter((p): p is Scored => p !== null);
    if (!parts.length) continue;
    const evidence = parts.flatMap((p) => p.evidence);
    const active = daysSince(inp.now, lastActive.get(handle) ?? -Infinity) <= inp.config.activeDays;
    if (!active) {
      evidence.push({ kind: 'inactive', text: `no commits or passes in this repository in the last ${inp.config.activeDays} days` });
    }
    if (handle === inp.me) for (const f of zoneFlags(zone, inp)) evidence.push({ kind: 'flag', text: FLAG_TEXT[f] });
    people.push({ handle, level: Math.round(clamp(Math.max(...parts.map((p) => p.level)))), active, evidence });
  }
  return people.sort((a, b) => b.level - a.level || (a.handle < b.handle ? -1 : a.handle > b.handle ? 1 : 0));
}

// ---- zone state ------------------------------------------------------------

/**
 * Solo mode counts only `me`, active or not ("active" is a team bus-factor concept).
 * In team mode inactive people never count toward Owned, Fragile or Fading.
 */
export function zoneState(people: PersonLevel[], agentShare: number, hasEvidence: boolean, inp: ScoreInputs): ZoneState {
  const { threshold, fadingFloor, mode } = inp.config;
  const active = people.filter((p) => (mode === 'team' ? p.active : p.handle === inp.me));
  const above = active.filter((p) => p.level >= threshold).length;
  if (mode === 'solo') {
    if (above) return 'owned';
    if (active.some((p) => p.level >= fadingFloor)) return 'fading';
    return hasEvidence ? 'dark' : 'unknown';
  }
  if (above >= 2) return 'owned';
  if (above === 1) return 'fragile';
  if (active.some((p) => p.level >= fadingFloor)) return 'fading';
  if (agentShare >= DARK_AGENT_SHARE || (people.length > 0 && !active.length)) return 'dark';
  return 'unknown';
}

// ---- criticality and ranking -----------------------------------------------

/**
 * Percentile rank of v among all zones' values, in [0, 1]:
 *   rank(v) = v > 0 ? |{w ∈ values : w ≤ v}| / |values| : 0
 * Ties share a rank, the highest value ranks 1, a zero never adds criticality,
 * and a single zone ranks 1 if its value is above 0, else 0.
 */
function rank(values: number[], v: number): number {
  return v > 0 ? values.filter((w) => w <= v).length / values.length : 0;
}

type Signals = Omit<Criticality, 'score'>;

function signals(zone: Zone, touches: Touch[], inp: ScoreInputs, isCritical: (p: string) => boolean): Signals {
  const recent = touches.filter((t) => daysSince(inp.now, t.time) <= RECENT_DAYS);
  return {
    fanIn: Math.max(0, num(inp.fanIn[zone.id])),
    churn90: recent.length,
    loc: zone.loc,
    fixes90: recent.filter((t) => FIX_RE.test(t.message)).length,
    tagged: zone.files.some(isCritical),
  };
}

function criticality(all: Signals[]): Criticality[] {
  const col = (k: 'fanIn' | 'churn90' | 'loc' | 'fixes90') => all.map((s) => s[k]);
  const [fanIn, churn, loc, fixes] = [col('fanIn'), col('churn90'), col('loc'), col('fixes90')];
  return all.map((s) => {
    const score = CRIT.fanIn * rank(fanIn, s.fanIn) + CRIT.churn * rank(churn, s.churn90)
      + CRIT.loc * rank(loc, s.loc) + CRIT.fixes * rank(fixes, s.fixes90) + (s.tagged ? CRIT.tagged : 0);
    return { ...s, score: Math.round(score * 100) / 100 };
  });
}

function reasonFor(state: ZoneState, c: Criticality): string {
  const parts = [state[0].toUpperCase() + state.slice(1)];
  if (c.fanIn > 0) parts.push(`${plural(c.fanIn, 'file imports', 'files import')} it`);
  if (c.fixes90 > 0) parts.push(`${plural(c.fixes90, 'fix', 'fixes')} in the last ${RECENT_DAYS} days`);
  if (c.tagged) parts.push('tagged critical');
  return parts.join(' · ');
}

export function scoreMap(inp: ScoreInputs): MapResult {
  const isCritical = inp.config.critical.length ? picomatch(inp.config.critical, { dot: true }) : () => false;
  const drafts = inp.zones.map((zone) => {
    const touches = zoneTouches(zone, inp);
    const people = personLevels(zone, inp);
    const agentShare = zoneAgentShare(zone, touches, inp);
    const state = zoneState(people, agentShare, people.length > 0 || agentShare > 0, inp);
    return { zone, people, agentShare, state, signals: signals(zone, touches, inp, isCritical) };
  });
  const crits = criticality(drafts.map((d) => d.signals));

  const zones: ZoneResult[] = drafts.map(({ zone, people, agentShare, state }, i) => ({
    zone, state, people, agentShare,
    criticality: crits[i],
    darkness: DARKNESS[state],
    danger: DARKNESS[state] * crits[i].score,
    reason: reasonFor(state, crits[i]),
    flags: zoneFlags(zone, inp),
  }));

  const byId = (a: ZoneResult, b: ZoneResult) => (a.zone.id < b.zone.id ? -1 : a.zone.id > b.zone.id ? 1 : 0);
  const top = zones.filter((z) => z.danger > 0)
    .sort((a, b) => b.danger - a.danger || b.criticality.score - a.criticality.score || byId(a, b))
    .slice(0, 10);
  const unclearCritical = zones.filter((z) => z.state === 'unknown' && z.criticality.score >= 0.5)
    .sort((a, b) => b.criticality.score - a.criticality.score || byId(a, b))
    .slice(0, 3);
  const counts = Object.fromEntries(STATES.map((s) => [s, zones.filter((z) => z.state === s).length])) as Record<ZoneState, number>;

  return { mode: inp.config.mode, generatedAt: inp.now.toISOString(), me: inp.me, zones, top, unclearCritical, counts };
}
