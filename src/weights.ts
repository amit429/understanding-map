import type { ZoneState } from './types.js';

// The one place to tune the map's numbers (spec §7.1–7.2). Every level is an estimate.

/** Starting level for anyone who committed to a zone. */
export const HUMAN_BASE = 30;
/** Points per unit of authorship share (lines you added ÷ zone lines of code)... */
export const HUMAN_SHARE_MULT = 80;
/** ...capped at this many points. */
export const HUMAN_SHARE_MAX = 40;
/** Points removed when all of a person's lines were agent-written; scales with the agent fraction. */
export const AGENT_PENALTY = 50;
/** Points per PR review in the zone... */
export const REVIEW_PER = 5;
/** ...capped at this many points. */
export const REVIEW_MAX = 10;

/** How dark each state counts for ranking: danger = darkness × criticality. Unknown zones are never ranked. */
export const DARKNESS: Record<ZoneState, number> = { dark: 1, fading: 0.6, fragile: 0.4, owned: 0.1, unknown: 0 };

/** Weights of each percentile-ranked criticality signal, plus a flat boost for zones tagged critical in config. */
export const CRIT = { fanIn: 0.35, churn: 0.25, loc: 0.15, fixes: 0.25, tagged: 1 } as const;

/** Commit messages that count as bug history. */
export const FIX_RE = /\b(fix|bug|hotfix|revert|incident)\b/i;

/** In team mode a zone at least this agent-written, with nobody active at the Fading floor, is Dark. */
export const DARK_AGENT_SHARE = 0.5;
