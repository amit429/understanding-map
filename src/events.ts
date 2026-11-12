import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { umDir } from './config.js';
import { readJsonlUnion } from './jsonl-union.js';
import { sanitizeHandle } from './identity.js';
import type { Flag, PassEvent } from './types.js';

const eventsRel = '.understanding/events';
const localDir = (root: string) => join(umDir(root), 'local');

function appendJsonl(dir: string, file: string, value: unknown): void {
  mkdirSync(dir, { recursive: true });
  appendFileSync(join(dir, file), JSON.stringify(value) + '\n');
}

/** The only per-person data shared in team mode: passes, one append-only file per handle. */
export function appendPass(root: string, handle: string, ev: PassEvent): void {
  appendJsonl(join(root, eventsRel), `${sanitizeHandle(handle)}.jsonl`, ev);
}

export function readPasses(root: string, defaultRef: string | null): Map<string, PassEvent[]> {
  const out = new Map<string, PassEvent[]>();
  for (const [name, lines] of readJsonlUnion(root, eventsRel, defaultRef)) {
    const evs: PassEvent[] = [];
    for (const line of lines) {
      try {
        evs.push(JSON.parse(line) as PassEvent);
      } catch { /* skip */ }
    }
    out.set(name.replace(/\.jsonl$/, ''), evs);
  }
  return out;
}

export function appendLocalPartial(root: string, ev: PassEvent): void {
  appendJsonl(localDir(root), 'partials.jsonl', ev);
}

export function readLocalPartials(root: string): PassEvent[] {
  let text: string;
  try {
    text = readFileSync(join(localDir(root), 'partials.jsonl'), 'utf8');
  } catch {
    return [];
  }
  const out: PassEvent[] = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line) as PassEvent);
    } catch { /* skip */ }
  }
  return out;
}

export function appendAttempt(
  root: string,
  a: { zone: string; kind: 'session' | 'handoff'; result: 'partial' | 'miss'; date: string; retryAfter?: string },
): void {
  appendJsonl(localDir(root), 'attempts.jsonl', a);
}

export function readFlags(root: string): Record<string, Flag[]> {
  try {
    const v: unknown = JSON.parse(readFileSync(join(localDir(root), 'flags.json'), 'utf8'));
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) return v as Record<string, Flag[]>;
  } catch { /* none yet */ }
  return {};
}

function writeFlags(root: string, flags: Record<string, Flag[]>): void {
  mkdirSync(localDir(root), { recursive: true });
  writeFileSync(join(localDir(root), 'flags.json'), JSON.stringify(flags, null, 2) + '\n');
}

export function addFlag(root: string, zone: string, flag: Flag): void {
  const flags = readFlags(root);
  const cur = Array.isArray(flags[zone]) ? flags[zone] : [];
  if (cur.includes(flag)) return;
  flags[zone] = [...cur, flag];
  writeFlags(root, flags);
}

/** Removes one flag from a zone; a zone left with no flags is dropped. */
export function removeFlag(root: string, zone: string, flag: Flag): void {
  const flags = readFlags(root);
  const cur = Object.hasOwn(flags, zone) && Array.isArray(flags[zone]) ? flags[zone] : [];
  if (!cur.includes(flag)) return;
  const rest = cur.filter((f) => f !== flag);
  if (rest.length) flags[zone] = rest;
  else delete flags[zone];
  writeFlags(root, flags);
}
