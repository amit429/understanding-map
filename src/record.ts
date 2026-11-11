import { dirname } from 'node:path';
import { addFlag, appendAttempt, appendLocalPartial, appendPass } from './events.js';
import { markChecked, uncheckedEdits } from './editlog.js';
import { buildMap } from './pipeline.js';
import { readZoneCache } from './zones.js';
import type { EditLogEntry, ZoneState } from './types.js';

export type Grade = 'pass' | 'partial' | 'miss';

export interface RecordChange { zone: string; before: ZoneState; after: ZoneState; levelBefore: number; levelAfter: number }

const SCORE: Record<Grade, number> = { pass: 1, partial: 0.5, miss: 0 };
const DAY = 86_400_000;

/** §8.1: pass needs an average of at least 0.67 and no miss; partial an average of at least 0.34. */
export function gradeSession(grades: Grade[]): Grade {
  if (grades.length === 0) return 'miss';
  const avg = grades.reduce((s, g) => s + SCORE[g], 0) / grades.length;
  if (avg >= 0.67 && !grades.includes('miss')) return 'pass';
  return avg >= 0.34 ? 'partial' : 'miss';
}

export function handoffSet(root: string): { totalLines: number; zones: Array<{ zone: string; lines: number; files: string[] }>; edits: EditLogEntry[] } {
  const edits = uncheckedEdits(root);
  const cache = readZoneCache(root) ?? {};
  const by = new Map<string, { zone: string; lines: number; files: string[] }>();
  for (const e of edits) {
    const dir = dirname(e.file);
    const id = cache[e.file] ?? (dir === '.' ? '(root)' : dir);
    const z = by.get(id) ?? { zone: id, lines: 0, files: [] };
    z.lines += e.lines;
    if (!z.files.includes(e.file)) z.files.push(e.file);
    by.set(id, z);
  }
  return {
    totalLines: edits.reduce((s, e) => s + e.lines, 0),
    zones: [...by.values()].sort((a, b) => b.lines - a.lines),
    edits,
  };
}

function clearHandoff(root: string, edits: EditLogEntry[]): void {
  if (edits.length) markChecked(root, edits.reduce((m, e) => (e.ts > m ? e.ts : m), ''));
}

export function recordResult(
  root: string,
  r: { kind: 'session' | 'handoff'; zones: string[]; grades: Grade[]; now?: Date; homeDir?: string },
): { result: Grade; changes: RecordChange[] } {
  const now = r.now ?? new Date();
  const date = now.toISOString();
  const opts = { now, homeDir: r.homeDir };
  const result = gradeSession(r.grades);
  const handoff = r.kind === 'handoff' ? handoffSet(root) : null;
  const zoneIds = handoff ? handoff.zones.map((z) => z.zone) : r.zones;

  const before = buildMap(root, opts);
  const levelOf = (m: typeof before, id: string) => m.zones.find((z) => z.zone.id === id)?.people.find((p) => p.handle === m.me)?.level ?? 0;
  const live = zoneIds.filter((id) => before.zones.some((z) => z.zone.id === id));

  if (handoff) {
    if (result === 'pass') {
      for (const id of live) {
        const z = before.zones.find((x) => x.zone.id === id)!;
        appendPass(root, before.me, { zone: id, level: Math.max(levelOf(before, id), 65), fingerprint: z.zone.fingerprint, date, kind: 'handoff' });
      }
    } else if (result === 'miss') {
      for (const id of zoneIds) addFlag(root, id, 'unreviewed-agent-code');
    }
    clearHandoff(root, handoff.edits);
  } else {
    for (const id of live) {
      const z = before.zones.find((x) => x.zone.id === id)!;
      const current = levelOf(before, id);
      if (result === 'pass') {
        appendPass(root, before.me, { zone: id, level: Math.max(current, 80), fingerprint: z.zone.fingerprint, date, kind: 'session' });
      } else if (result === 'partial') {
        appendLocalPartial(root, { zone: id, level: Math.max(current, 50), fingerprint: z.zone.fingerprint, date, kind: 'session' });
        appendAttempt(root, { zone: id, kind: 'session', result: 'partial', date });
      } else {
        appendAttempt(root, { zone: id, kind: 'session', result: 'miss', date, retryAfter: new Date(now.getTime() + 3 * DAY).toISOString() });
      }
    }
  }

  const after = buildMap(root, opts);
  const changes = live.map((id) => ({
    zone: id,
    before: before.zones.find((z) => z.zone.id === id)!.state,
    after: after.zones.find((z) => z.zone.id === id)?.state ?? 'unknown',
    levelBefore: levelOf(before, id),
    levelAfter: levelOf(after, id),
  }));
  return { result, changes };
}

/** Skipping the handoff check leaves the touched zones flagged as unreviewed agent code. */
export function skipHandoff(root: string, _now: Date = new Date()): void {
  const set = handoffSet(root);
  for (const z of set.zones) addFlag(root, z.zone, 'unreviewed-agent-code');
  clearHandoff(root, set.edits);
}

export function markUnverifiable(root: string, zone: string): void {
  addFlag(root, zone, 'hard-to-verify');
}
