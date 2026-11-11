import { homedir } from 'node:os';
import { agentLinesByCommit, backfillSessionEdits, isoWeek, readAgentShares, syncAgentShare } from './attribution.js';
import { loadConfig } from './config.js';
import { readEdits } from './editlog.js';
import { readFlags, readLocalPartials, readPasses } from './events.js';
import { commitsWithNotes, currentEmail, defaultBranchRef, listTrackedFiles, readHistory } from './git.js';
import { handleFor } from './identity.js';
import { fanInByZone } from './imports.js';
import { scoreMap } from './scoring.js';
import type { Commit, MapResult, Zone } from './types.js';
import { buildZones, readFileEntries, writeZoneCache, zoneIndex } from './zones.js';

export interface BuildOptions {
  now?: Date;
  reviews?: Record<string, Record<string, number>>;
  /** Where session logs are looked up for solo backfill. Defaults to the user's home directory. */
  homeDir?: string;
}

/** zone → min(1, agent lines shared by the team within the history window ÷ lines added there in the window). */
function sharedShareByZone(
  root: string, zones: Zone[], commits: Commit[], now: Date, historyDays: number, defaultRef: string | null,
): Record<string, number> {
  const zoneOf = zoneIndex(zones);
  const added: Record<string, number> = {};
  for (const c of commits) {
    for (const f of c.files) {
      const z = zoneOf.get(f.path);
      if (z) added[z] = (added[z] ?? 0) + Math.max(0, f.added);
    }
  }
  const first = isoWeek(new Date(now.getTime() - historyDays * 86_400_000));
  const last = isoWeek(now);
  const agent: Record<string, number> = {};
  for (const e of readAgentShares(root, defaultRef)) {
    if (e.week < first || e.week > last) continue;
    agent[e.zone] = (agent[e.zone] ?? 0) + Math.max(0, e.agentLines);
  }
  const out: Record<string, number> = {};
  for (const [z, n] of Object.entries(agent)) if (added[z] > 0) out[z] = Math.min(1, n / added[z]);
  return out;
}

export function buildMap(root: string, opts: BuildOptions = {}): MapResult {
  const now = opts.now ?? new Date();
  const config = loadConfig(root);
  const files = readFileEntries(root, listTrackedFiles(root), config.exclude);
  const zones = buildZones(files, config);
  writeZoneCache(root, zones);
  const fileLoc = Object.fromEntries(files.map((f) => [f.path, f.loc]));

  const commits = readHistory(root, config.historyDays, now);
  const notedShas = commitsWithNotes(root, 'refs/notes/ai');
  const solo = config.mode === 'solo';
  const edits = readEdits(root);
  if (solo) {
    // Sessions the live hook already logged would be double-counted by the backfill.
    const live = new Set(edits.map((e) => e.session));
    edits.push(...backfillSessionEdits(root, opts.homeDir ?? homedir()).filter((e) => !live.has(e.session)));
  }
  const agentLines = agentLinesByCommit(commits, edits, notedShas);

  const defaultRef = defaultBranchRef(root);
  let sharedAgentShare: Record<string, number> = {};
  if (!solo) {
    // Only private edit-log knowledge is shared; trailers and notes are already public (R6).
    syncAgentShare(root, zones, commits, agentLinesByCommit(commits, edits, notedShas, { includeTrailersAndNotes: false }));
    sharedAgentShare = sharedShareByZone(root, zones, commits, now, config.historyDays, defaultRef);
  }

  const me = handleFor(currentEmail(root), config) || 'me';
  return scoreMap({
    config, now, me,
    handleOf: (email) => handleFor(email, config),
    zones, commits, agentLines, sharedAgentShare, fileLoc,
    passes: readPasses(root, defaultRef),
    localPartials: readLocalPartials(root),
    fanIn: fanInByZone(root, files, zones, commits),
    reviews: opts.reviews ?? {},
    flags: readFlags(root),
  });
}
