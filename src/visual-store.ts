import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { umDir } from './config.js';
import { refFiles, type Storyboard } from './storyboard.js';

/** What `<slug>.json` holds: the verified storyboard and what it was drawn from. Scene-1 data is never saved. */
export interface SavedVisual { zone: string; date: string; fingerprint: Record<string, string>; storyboard: Storyboard }

/**
 * File-name slug for a zone's visual (design 9a.7): lowercase, every run outside [a-z0-9] becomes "-", dashes
 * trimmed, then "-" and the first 6 hex characters of the id's sha1, so "a/b" and "a-b" never collide. An id with
 * nothing left after that (for example only non-Latin characters) uses "zone" as its base, never a leading dash.
 */
export function visualSlug(zoneId: string): string {
  const base = zoneId.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'zone';
  return `${base}-${createHash('sha1').update(zoneId).digest('hex').slice(0, 6)}`;
}

export const visualsDir = (root: string) => join(umDir(root), 'local', 'visuals');
/** The page's path relative to `.understanding/` (where report.html lives). */
export const visualHref = (zoneId: string) => `local/visuals/${visualSlug(zoneId)}.html`;

const MISSING = 'missing';
function hashFile(root: string, path: string): string {
  try {
    return createHash('sha1').update(readFileSync(join(root, path))).digest('hex').slice(0, 12);
  } catch {
    return MISSING;
  }
}

/** Hashes of the zone's files plus every file named by any ref (design 9a.2). */
export function visualFingerprint(root: string, zoneFiles: string[], storyboard: Storyboard): Record<string, string> {
  const paths = [...new Set([...zoneFiles, ...refFiles(storyboard)])].sort();
  return Object.fromEntries(paths.map((p) => [p, hashFile(root, p)]));
}

export function saveVisual(root: string, saved: SavedVisual, html: string): { html: string; json: string } {
  const dir = visualsDir(root);
  mkdirSync(dir, { recursive: true });
  const base = join(dir, visualSlug(saved.zone));
  writeFileSync(`${base}.html`, html);
  writeFileSync(`${base}.json`, JSON.stringify(saved, null, 2) + '\n');
  return { html: `${base}.html`, json: `${base}.json` };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

export function readSavedVisual(root: string, zoneId: string): SavedVisual | null {
  try {
    const v: unknown = JSON.parse(readFileSync(join(visualsDir(root), `${visualSlug(zoneId)}.json`), 'utf8'));
    if (!isObj(v) || v.zone !== zoneId || typeof v.date !== 'string' || !isObj(v.fingerprint) || !isObj(v.storyboard)) return null;
    if (!Array.isArray(v.storyboard.steps)) return null;
    return v as unknown as SavedVisual;
  } catch {
    return null;
  }
}

/** A saved visual is fresh while every file it depends on hashes the same and the zone has the same files. */
export function checkFresh(root: string, zone: { id: string; files: string[] }, saved: SavedVisual): { fresh: true } | { fresh: false; reason: string } {
  let current: Record<string, string>;
  try {
    current = visualFingerprint(root, zone.files, saved.storyboard);
  } catch {
    return { fresh: false, reason: 'the saved storyboard could not be read' };
  }
  const keys = new Set([...Object.keys(current), ...Object.keys(saved.fingerprint)]);
  const changed = [...keys].filter((k) => current[k] !== saved.fingerprint[k] || current[k] === MISSING).sort();
  return changed.length
    ? { fresh: false, reason: `the code changed since the last visual (${changed.slice(0, 3).join(', ')}${changed.length > 3 ? ', …' : ''})` }
    : { fresh: true };
}
