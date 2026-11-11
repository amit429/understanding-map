import { randomBytes } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { umDir } from './config.js';
import { listAtRef, showAtRef } from './git.js';
import type { AgentShareEntry, Commit, EditLogEntry, Zone } from './types.js';
import { zoneIndex } from './zones.js';

/** sha -> path -> agent-written lines. `commits` is newest-first. */
export function agentLinesByCommit(
  commits: Commit[],
  edits: EditLogEntry[],
  notedShas: Set<string>,
  opts: { includeTrailersAndNotes?: boolean } = {},
): Map<string, Map<string, number>> {
  const includeAll = opts.includeTrailersAndNotes ?? true;
  const editsByFile = new Map<string, EditLogEntry[]>();
  for (const e of edits) (editsByFile.get(e.file) ?? editsByFile.set(e.file, []).get(e.file)!).push(e);

  const result = new Map<string, Map<string, number>>();
  commits.forEach((c, i) => {
    const perFile = new Map<string, number>();
    const wholeCommit = includeAll && (c.agentTrailer || notedShas.has(c.sha));
    for (const f of c.files) {
      if (f.added <= 0) continue;
      let lines = 0;
      if (wholeCommit) {
        lines = f.added;
      } else {
        const fileEdits = editsByFile.get(f.path);
        if (!fileEdits) continue;
        const prev = commits.slice(i + 1).find((p) => p.files.some((pf) => pf.path === f.path));
        const lo = prev ? prev.date.getTime() : -Infinity;
        const hi = c.date.getTime();
        const sum = fileEdits.filter((e) => { const t = Date.parse(e.ts); return t > lo && t <= hi; }).reduce((n, e) => n + e.lines, 0);
        lines = Math.min(f.added, sum);
      }
      if (lines > 0) perFile.set(f.path, (perFile.get(f.path) ?? 0) + lines);
    }
    if (perFile.size) result.set(c.sha, perFile);
  });
  return result;
}

const countLines = (s: unknown) => (typeof s === 'string' && s.length ? s.split('\n').length : 0);

function editLines(name: string, input: Record<string, unknown>): number {
  if (name === 'Edit') return countLines(input.new_string);
  if (name === 'Write') return countLines(input.content);
  if (Array.isArray(input.edits)) {
    return input.edits.reduce((n: number, e: { new_string?: unknown }) => n + countLines(e?.new_string), 0);
  }
  return 0;
}

export function backfillSessionEdits(root: string, homeDir: string): EditLogEntry[] {
  const dir = join(homeDir, '.claude', 'projects', root.replace(/[^A-Za-z0-9-]/g, '-'));
  let names: string[];
  try {
    names = readdirSync(dir).filter((n) => n.endsWith('.jsonl')).sort();
  } catch {
    return [];
  }
  const out: EditLogEntry[] = [];
  for (const name of names) {
    let text: string;
    try {
      text = readFileSync(join(dir, name), 'utf8');
    } catch {
      continue;
    }
    for (const line of text.split('\n')) {
      if (!line.trim()) continue;
      try {
        const rec = JSON.parse(line);
        if (rec?.type !== 'assistant' || typeof rec.timestamp !== 'string' || !Array.isArray(rec.message?.content)) continue;
        const session = typeof rec.sessionId === 'string' ? rec.sessionId : name.replace(/\.jsonl$/, '');
        for (const block of rec.message.content) {
          if (block?.type !== 'tool_use' || !['Edit', 'Write', 'MultiEdit'].includes(block.name)) continue;
          const input = block.input ?? {};
          const fp = input.file_path;
          if (typeof fp !== 'string') continue;
          const rel = relative(root, fp);
          if (!rel || rel.startsWith('..') || rel.startsWith(sep) || /^[A-Za-z]:/.test(rel)) continue;
          const lines = editLines(block.name, input);
          if (lines <= 0) continue;
          out.push({ file: rel.split(sep).join('/'), ranges: [], lines, session, ts: rec.timestamp });
        }
      } catch { /* skip unparseable line */ }
    }
  }
  return out;
}

export function isoWeek(d: Date): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(t.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((t.getTime() - yearStart) / 86_400_000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

const localDir = (root: string) => join(umDir(root), 'local');
const shareDir = (root: string) => join(umDir(root), 'agent-share');

export function machineId(root: string): string {
  const path = join(localDir(root), 'machine-id');
  try {
    const id = readFileSync(path, 'utf8').trim();
    if (/^[0-9a-f]{8}$/.test(id)) return id;
  } catch { /* create below */ }
  const id = randomBytes(4).toString('hex');
  mkdirSync(localDir(root), { recursive: true });
  writeFileSync(path, id);
  return id;
}

export function syncAgentShare(
  root: string,
  zones: Zone[],
  commits: Commit[],
  agentLines: Map<string, Map<string, number>>,
): void {
  const zoneOf = zoneIndex(zones);
  const totals = new Map<string, { zone: string; week: string; total: number }>();
  for (const c of commits) {
    const perFile = agentLines.get(c.sha);
    if (!perFile) continue;
    const week = isoWeek(c.date);
    for (const [path, n] of perFile) {
      const zone = zoneOf.get(path);
      if (!zone || n <= 0) continue;
      const key = `${zone}|${week}`;
      const cur = totals.get(key) ?? { zone, week, total: 0 };
      cur.total += n;
      totals.set(key, cur);
    }
  }

  const writtenPath = join(localDir(root), 'agent-share-written.json');
  let written: Record<string, number> = {};
  try {
    const v: unknown = JSON.parse(readFileSync(writtenPath, 'utf8'));
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) written = v as Record<string, number>;
  } catch { /* none yet */ }

  const lines: string[] = [];
  for (const [key, { zone, week, total }] of totals) {
    const delta = total - (written[key] ?? 0);
    if (delta <= 0) continue;
    const entry: AgentShareEntry = { zone, agentLines: delta, week };
    lines.push(JSON.stringify(entry));
    written[key] = total;
  }
  if (!lines.length) return;

  mkdirSync(shareDir(root), { recursive: true });
  appendFileSync(join(shareDir(root), `${machineId(root)}.jsonl`), lines.join('\n') + '\n');
  mkdirSync(localDir(root), { recursive: true });
  writeFileSync(writtenPath, JSON.stringify(written));
}

export function readAgentShares(root: string, defaultRef: string | null): AgentShareEntry[] {
  const texts: string[] = [];
  if (existsSync(shareDir(root))) {
    for (const n of readdirSync(shareDir(root)).filter((x) => x.endsWith('.jsonl')).sort()) {
      try {
        texts.push(readFileSync(join(shareDir(root), n), 'utf8'));
      } catch { /* skip */ }
    }
  }
  if (defaultRef) {
    for (const p of listAtRef(root, defaultRef, '.understanding/agent-share')) {
      if (!p.endsWith('.jsonl')) continue;
      const t = showAtRef(root, defaultRef, p);
      if (t !== null) texts.push(t);
    }
  }
  const seen = new Set<string>();
  const out: AgentShareEntry[] = [];
  for (const text of texts) {
    for (const line of text.split('\n')) {
      if (!line.trim() || seen.has(line)) continue;
      seen.add(line);
      try {
        const v = JSON.parse(line) as AgentShareEntry;
        if (typeof v.zone === 'string' && typeof v.agentLines === 'number' && typeof v.week === 'string') out.push(v);
      } catch { /* skip */ }
    }
  }
  return out;
}
