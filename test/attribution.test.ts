import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  agentLinesByCommit, backfillSessionEdits, isoWeek, machineId, readAgentShares, syncAgentShare,
} from '../src/attribution';
import { appendEdit, getNudgedLines, markChecked, readEdits, setNudgedLines, uncheckedEdits } from '../src/editlog';
import type { Commit, EditLogEntry, Zone } from '../src/types';
import { gitIn, makeRepo } from './helpers/repo';

const commit = (sha: string, date: string, files: Array<[string, number]>, agentTrailer = false): Commit => ({
  sha, email: 'a@b.c', date: new Date(date), message: '', agentTrailer,
  files: files.map(([path, added]) => ({ path, added, deleted: 0 })),
});
const edit = (file: string, lines: number, ts: string): EditLogEntry => ({ file, ranges: [], lines, session: 's', ts });
const tmp = () => mkdtempSync(join(tmpdir(), 'umap-attr-'));

describe('agentLinesByCommit', () => {
  it('with isMine, matches edit-log lines only to my commits; trailers and notes still count for everyone', () => {
    const theirs = { ...commit('c2', '2026-01-02T00:00:00Z', [['f', 10]]), email: 'bob@x.io' };
    const trailer = { ...commit('c1', '2026-01-01T00:00:00Z', [['g', 7]], true), email: 'bob@x.io' };
    const mine = commit('c0', '2025-12-31T00:00:00Z', [['h', 4]]);
    const edits = [edit('f', 6, '2026-01-01T12:00:00Z'), edit('h', 4, '2025-12-30T00:00:00Z')];
    const r = agentLinesByCommit([theirs, trailer, mine], edits, new Set(), { isMine: (e) => e === 'a@b.c' });
    expect(r.has('c2')).toBe(false);
    expect(r.get('c1')!.get('g')).toBe(7);
    expect(r.get('c0')!.get('h')).toBe(4);
  });

  it('counts all added lines for trailer commits and noted commits', () => {
    const commits = [commit('c2', '2026-01-02T00:00:00Z', [['f', 5]]), commit('c1', '2026-01-01T00:00:00Z', [['g', 7]], true)];
    const r = agentLinesByCommit(commits, [], new Set(['c2']));
    expect(r.get('c2')!.get('f')).toBe(5);
    expect(r.get('c1')!.get('g')).toBe(7);
  });

  it('matches edits between the previous commit touching the file and this commit, capped at added', () => {
    const commits = [
      commit('c3', '2026-01-03T00:00:00Z', [['f', 10]]),
      commit('c2', '2026-01-02T00:00:00Z', [['other', 4]]),
      commit('c1', '2026-01-01T00:00:00Z', [['f', 3]]),
    ];
    const edits = [
      edit('f', 99, '2026-01-01T00:00:00Z'), // at previous commit: not after it
      edit('f', 2, '2026-01-01T12:00:00Z'),
      edit('f', 3, '2026-01-03T00:00:00Z'), // at the commit: counts
      edit('f', 50, '2026-01-03T00:00:01Z'), // after the commit: no
    ];
    const r = agentLinesByCommit(commits, edits, new Set());
    expect(r.get('c3')!.get('f')).toBe(5);
    expect(r.has('c2')).toBe(false);
    const capped = agentLinesByCommit(commits, [edit('f', 100, '2026-01-02T12:00:00Z')], new Set());
    expect(capped.get('c3')!.get('f')).toBe(10);
  });

  it('with includeTrailersAndNotes false counts only edit-log lines', () => {
    const commits = [commit('c2', '2026-01-02T00:00:00Z', [['f', 5]], true), commit('c1', '2026-01-01T00:00:00Z', [['g', 7]])];
    const none = agentLinesByCommit(commits, [], new Set(['c1']), { includeTrailersAndNotes: false });
    expect(none.size).toBe(0);
    const some = agentLinesByCommit(commits, [edit('f', 2, '2026-01-01T12:00:00Z')], new Set(), { includeTrailersAndNotes: false });
    expect(some.get('c2')!.get('f')).toBe(2);
  });
});

describe('backfillSessionEdits', () => {
  it('reads Claude Code session logs for edits inside the repo', () => {
    const home = tmp();
    const root = '/Users/a/my_proj.x';
    const dir = join(home, '.claude', 'projects', '-Users-a-my-proj-x');
    mkdirSync(dir, { recursive: true });
    const fixture = readFileSync(join(__dirname, 'fixtures', 'session.jsonl'), 'utf8').replaceAll('__ROOT__', root);
    writeFileSync(join(dir, 'abc.jsonl'), fixture);
    writeFileSync(join(dir, 'noid.jsonl'), JSON.stringify({
      type: 'assistant', timestamp: '2026-11-11T00:00:00.000Z',
      message: { content: [{ type: 'tool_use', name: 'Write', input: { file_path: `${root}/z.ts`, content: 'q' } }] },
    }));
    const r = backfillSessionEdits(root, home);
    expect(r.filter((e) => e.session === 'abc')).toEqual([
      { file: 'src/a.ts', ranges: [], lines: 2, session: 'abc', ts: '2026-11-10T09:00:00.000Z' },
      { file: 'src/b.ts', ranges: [], lines: 3, session: 'abc', ts: '2026-11-10T09:01:00.000Z' },
      { file: 'src/c.ts', ranges: [], lines: 3, session: 'abc', ts: '2026-11-10T09:02:00.000Z' },
    ]);
    expect(r.find((e) => e.file === 'z.ts')!.session).toBe('noid');
    expect(backfillSessionEdits(root, tmp())).toEqual([]);
  });
});

describe('isoWeek and machineId', () => {
  it('computes ISO weeks', () => {
    expect(isoWeek(new Date('2026-11-12'))).toBe('2026-W46');
    expect(isoWeek(new Date('2026-01-01'))).toBe('2026-W01');
    expect(isoWeek(new Date('2027-01-01'))).toBe('2026-W53');
  });

  it('creates a stable 8-hex machine id in local/machine-id', () => {
    const root = tmp();
    const id = machineId(root);
    expect(id).toMatch(/^[0-9a-f]{8}$/);
    expect(machineId(root)).toBe(id);
    expect(readFileSync(join(root, '.understanding', 'local', 'machine-id'), 'utf8').trim()).toBe(id);
  });
});

describe('syncAgentShare / readAgentShares', () => {
  const zones: Zone[] = [{ id: 'src', files: ['src/a.ts'], loc: 10, fingerprint: {} }];
  const commits = [commit('c1', '2026-11-12T10:00:00Z', [['src/a.ts', 8], ['nozone.ts', 5]])];
  const shareFiles = (root: string) => {
    const d = join(root, '.understanding', 'agent-share');
    return existsSync(d) ? readdirSync(d).map((n) => join(d, n)) : [];
  };
  const allLines = (root: string) => shareFiles(root).flatMap((f) => readFileSync(f, 'utf8').split('\n').filter(Boolean));

  it('writes anonymous per-zone weekly totals, only deltas', () => {
    const root = tmp();
    syncAgentShare(root, zones, commits, new Map([['c1', new Map([['src/a.ts', 6], ['nozone.ts', 5]])]]));
    expect(allLines(root).map((l) => JSON.parse(l))).toEqual([{ zone: 'src', agentLines: 6, week: '2026-W46' }]);
    syncAgentShare(root, zones, commits, new Map([['c1', new Map([['src/a.ts', 6]])]]));
    expect(allLines(root)).toHaveLength(1);
    syncAgentShare(root, zones, commits, new Map([['c1', new Map([['src/a.ts', 8]])]]));
    expect(allLines(root).map((l) => JSON.parse(l).agentLines)).toEqual([6, 2]);
    for (const l of allLines(root)) expect(Object.keys(JSON.parse(l)).sort()).toEqual(['agentLines', 'week', 'zone']);
  });

  const L = (zone: string, agentLines: number, week = '2026-W46') => JSON.stringify({ zone, agentLines, week });
  const shareIn = (root: string, name: string, lines: string[]) => {
    mkdirSync(join(root, '.understanding', 'agent-share'), { recursive: true });
    writeFileSync(join(root, '.understanding', 'agent-share', name), lines.join('\n') + '\n');
  };

  it('returns a share file that exists only at the ref', () => {
    const root = makeRepo([{ files: { '.understanding/agent-share/aaaa1111.jsonl': L('src', 6) + '\n' } }]);
    gitIn(root, ['branch', 'base']);
    rmSync(join(root, '.understanding'), { recursive: true });
    expect(readAgentShares(root, 'base')).toEqual([{ zone: 'src', agentLines: 6, week: '2026-W46' }]);
    expect(readAgentShares(root, null)).toEqual([]);
  });

  it('counts ref lines once when the working copy is the ref copy plus an appended line', () => {
    const root = makeRepo([{ files: { '.understanding/agent-share/aaaa1111.jsonl': L('src', 6) + '\n' } }]);
    gitIn(root, ['branch', 'base']);
    shareIn(root, 'aaaa1111.jsonl', [L('src', 6), L('lib', 1, '2026-W45')]);
    expect(readAgentShares(root, 'base')).toEqual([
      { zone: 'src', agentLines: 6, week: '2026-W46' }, { zone: 'lib', agentLines: 1, week: '2026-W45' },
    ]);
  });

  it('keeps repeated identical lines within one file and across different machine files', () => {
    const root = tmp();
    shareIn(root, 'aaaa1111.jsonl', [L('src', 3), L('src', 3)]);
    shareIn(root, 'bbbb2222.jsonl', [L('src', 3)]);
    expect(readAgentShares(root, null)).toHaveLength(3);
  });

  it('appends per-week entries across commits and ignores paths outside any zone', () => {
    const root = tmp();
    const cs = [
      commit('c3', '2026-11-12T10:00:00Z', [['src/a.ts', 4]]),
      commit('c2', '2026-11-10T10:00:00Z', [['src/a.ts', 2], ['nozone.ts', 9]]),
      commit('c1', '2026-11-03T10:00:00Z', [['src/a.ts', 5]]),
    ];
    const al = new Map([
      ['c3', new Map([['src/a.ts', 4]])], ['c2', new Map([['src/a.ts', 2], ['nozone.ts', 9]])], ['c1', new Map([['src/a.ts', 5]])],
    ]);
    syncAgentShare(root, zones, cs, al);
    const got = allLines(root).map((l) => JSON.parse(l)).sort((a, b) => a.week.localeCompare(b.week));
    expect(got).toEqual([{ zone: 'src', agentLines: 5, week: '2026-W45' }, { zone: 'src', agentLines: 6, week: '2026-W46' }]);
  });
});

describe('editlog', () => {
  it('appends, reads, tracks checked and nudged state', () => {
    const root = tmp();
    expect(readEdits(root)).toEqual([]);
    appendEdit(root, edit('f', 3, '2026-01-01T00:00:00Z'));
    appendEdit(root, edit('f', 4, '2026-01-02T00:00:00Z'));
    expect(readEdits(root)).toHaveLength(2);
    expect(uncheckedEdits(root)).toHaveLength(2);
    setNudgedLines(root, 9);
    expect(getNudgedLines(root)).toBe(9);
    markChecked(root, '2026-01-01T00:00:00Z');
    expect(uncheckedEdits(root).map((e) => e.lines)).toEqual([4]);
    expect(getNudgedLines(root)).toBe(0);
  });
});
