import { readdirSync } from 'node:fs';
import { mapLineCounter, type StoryboardContext } from './storyboard.js';
import type { MapResult, ZoneResult } from './types.js';
import { checkStoryboard, renderVisual, type LiveZone } from './visual.js';
import { checkFresh, readSavedVisual, saveVisual, visualHref, visualsDir, visualSlug, type SavedVisual } from './visual-store.js';

/** Scene-1 data from the live map: state, reason and fan-in only (never people, levels or agent share). */
export const liveZone = (z: ZoneResult): LiveZone => ({ id: z.zone.id, state: z.state, reason: z.reason, fanIn: z.criticality.fanIn });

/** What a storyboard for `zoneId` is checked against: the current map's zones, files and people. */
export function storyboardContextFor(root: string, m: MapResult, zoneId: string): StoryboardContext {
  return {
    zone: zoneId,
    zones: Object.fromEntries(m.zones.map((z) => [z.zone.id, z.zone.files])),
    lineCount: mapLineCounter(root, m.zones.flatMap((z) => z.zone.files)),
    people: [...new Set(m.zones.flatMap((z) => z.people.map((p) => p.handle)))],
  };
}

/**
 * The one freshness rule, for both `visualize --cached` and the report link: a saved storyboard is reusable while
 * every file it depends on is unchanged, the zone has the same files, and it still passes every storyboard check
 * against the current map (so a journey zone that left the map makes it stale).
 */
export function reusableVisual(root: string, m: MapResult, z: ZoneResult): { saved: SavedVisual } | { reason: string } {
  const saved = readSavedVisual(root, z.zone.id);
  if (!saved) return { reason: 'no saved animation for this zone yet' };
  const fresh = checkFresh(root, { id: z.zone.id, files: z.zone.files }, saved);
  if (!fresh.fresh) return { reason: fresh.reason };
  try {
    checkStoryboard(saved.storyboard, storyboardContextFor(root, m, z.zone.id));
  } catch {
    return { reason: 'the saved storyboard no longer matches the map' };
  }
  return { saved };
}

/** Re-renders a reusable visual with live scene-1 data; returns the page path and its scenes. */
export function rerender(root: string, z: ZoneResult, saved: SavedVisual, date: string): { path: string; scenes: string[] } {
  const r = renderVisual(saved.storyboard, liveZone(z), date);
  return { path: saveVisual(root, saved, r.html).html, scenes: r.scenes };
}

/** For the report: re-renders every reusable visual with live data and maps its zone id to the page link. */
export function refreshVisuals(root: string, m: MapResult, date: string): Record<string, string> {
  let saved: Set<string>;
  try { saved = new Set(readdirSync(visualsDir(root))); } catch { return {}; }
  const out: Record<string, string> = {};
  for (const z of m.zones) {
    if (!saved.has(`${visualSlug(z.zone.id)}.json`)) continue;
    try {
      const r = reusableVisual(root, m, z);
      if (!('saved' in r)) continue;
      rerender(root, z, r.saved, date);
      out[z.zone.id] = visualHref(z.zone.id);
    } catch { /* never link a page that could not be refreshed */ }
  }
  return out;
}
