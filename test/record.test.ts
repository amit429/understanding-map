import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { appendEdit, uncheckedEdits } from '../src/editlog';
import { addFlag, appendPass, readFlags, removeFlag } from '../src/events';
import { buildMap } from '../src/pipeline';
import { gradeSession, handoffSet, markUnverifiable, readLastLearn, recordResult, skipHandoff } from '../src/record';
import { daysAgo, emptyHome, fixture, NOW } from './helpers/fixture';

const lines = (p: string) => (existsSync(p) ? readFileSync(p, 'utf8').trim().split('\n').map((l) => JSON.parse(l)) : []);
const um = (root: string, ...p: string[]) => join(root, '.understanding', ...p);
const setup = () => ({ root: fixture(), home: emptyHome() });
const edit = (root: string, file: string, n: number, ts: string) => appendEdit(root, { file, ranges: [], lines: n, session: 's', ts });

describe('gradeSession', () => {
  it.each([
    [['pass', 'pass', 'partial'], 'pass'],
    [['pass', 'pass', 'miss'], 'partial'],
    [['pass', 'partial', 'miss'], 'partial'],
    [['pass', 'pass'], 'pass'],
    [['pass', 'miss'], 'partial'],
    [['partial', 'partial'], 'partial'],
    [['miss', 'miss', 'pass'], 'miss'],
  ] as const)('%j -> %s', (g, want) => {
    expect(gradeSession([...g])).toBe(want);
  });
});

describe('recordResult session', () => {
  it('a pass appends a PassEvent at level max(current, 80) with the current fingerprint', () => {
    const { root, home } = setup();
    const before = buildMap(root, { now: NOW, homeDir: home }).zones.find((z) => z.zone.id === 'agent')!;
    const r = recordResult(root, { kind: 'session', zones: ['agent'], grades: ['pass', 'pass'], now: NOW, homeDir: home });
    expect(r.result).toBe('pass');
    const [ev] = lines(um(root, 'events', 'dev.jsonl'));
    expect(ev).toMatchObject({ zone: 'agent', level: 80, kind: 'session', date: NOW.toISOString(), fingerprint: before.zone.fingerprint });
    expect(r.changes[0]).toMatchObject({ zone: 'agent', before: 'dark', after: 'owned', levelAfter: 80 });
  });

  it('appendPass never writes outside events/, whatever the handle', () => {
    const { root } = setup();
    appendPass(root, '../../evil', { zone: 'agent', level: 80, fingerprint: {}, date: NOW.toISOString(), kind: 'session' });
    expect(readdirSync(um(root, 'events'))).toEqual(['..-..-evil.jsonl']);
    expect(existsSync(join(root, 'evil.jsonl'))).toBe(false);
  });

  it('a partial writes only local/partials.jsonl and an attempt, never events/', () => {
    const { root, home } = setup();
    const r = recordResult(root, { kind: 'session', zones: ['agent'], grades: ['partial', 'partial'], now: NOW, homeDir: home });
    expect(r.result).toBe('partial');
    expect(existsSync(um(root, 'events'))).toBe(false);
    expect(lines(um(root, 'local', 'partials.jsonl'))[0]).toMatchObject({ zone: 'agent', level: 50 });
    expect(lines(um(root, 'local', 'attempts.jsonl'))[0]).toMatchObject({ zone: 'agent', result: 'partial' });
  });

  it('a miss writes an attempt with retryAfter 3 days later and nothing else', () => {
    const { root, home } = setup();
    recordResult(root, { kind: 'session', zones: ['agent'], grades: ['miss'], now: NOW, homeDir: home });
    const [a] = lines(um(root, 'local', 'attempts.jsonl'));
    expect(a).toMatchObject({ zone: 'agent', kind: 'session', result: 'miss', retryAfter: new Date(NOW.getTime() + 3 * 86_400_000).toISOString() });
    expect(existsSync(um(root, 'events'))).toBe(false);
    expect(existsSync(um(root, 'local', 'partials.jsonl'))).toBe(false);
  });

  it('a partial never lowers a level above 50', () => {
    const { root, home } = setup();
    recordResult(root, { kind: 'session', zones: ['human'], grades: ['pass'], now: NOW, homeDir: home });
    const r = recordResult(root, { kind: 'session', zones: ['human'], grades: ['partial'], now: NOW, homeDir: home });
    expect(r.changes[0].levelAfter).toBeGreaterThanOrEqual(r.changes[0].levelBefore);
  });
});

describe('handoff', () => {
  it('groups unchecked edits by zone (cache, then directory fallback), sorted by lines', () => {
    const { root, home } = setup();
    buildMap(root, { now: NOW, homeDir: home });
    edit(root, 'agent/a.ts', 30, daysAgo(2));
    edit(root, 'human/h.ts', 80, daysAgo(1));
    edit(root, 'brand/new/x.ts', 10, daysAgo(1));
    edit(root, 'top.ts', 5, daysAgo(1));
    const s = handoffSet(root);
    expect(s.totalLines).toBe(125);
    expect(s.zones.map((z) => z.zone)).toEqual(['human', 'agent', 'brand/new', '(root)']);
    expect(s.zones[0]).toEqual({ zone: 'human', lines: 80, files: ['human/h.ts'] });
    expect(s.edits).toHaveLength(4);
  });

  it('leaves edits to excluded paths out of the set', () => {
    const { root } = setup();
    edit(root, 'dist/umap.js', 400, daysAgo(2));
    edit(root, 'node_modules/x/i.js', 40, daysAgo(2));
    edit(root, 'agent/a.ts', 30, daysAgo(1));
    const s = handoffSet(root);
    expect(s.totalLines).toBe(30);
    expect(s.zones.map((z) => z.zone)).toEqual(['agent']);
    expect(s.edits.map((e) => e.file)).toEqual(['agent/a.ts']);
  });

  it('a pass appends handoff passes at max(current, 65) and empties the set', () => {
    const { root, home } = setup();
    buildMap(root, { now: NOW, homeDir: home });
    edit(root, 'agent/a.ts', 60, daysAgo(1));
    const r = recordResult(root, { kind: 'handoff', zones: [], grades: ['pass', 'pass'], now: NOW, homeDir: home });
    expect(r.result).toBe('pass');
    expect(lines(um(root, 'events', 'dev.jsonl'))[0]).toMatchObject({ zone: 'agent', level: 65, kind: 'handoff' });
    expect(uncheckedEdits(root)).toEqual([]);
  });

  it('a miss flags touched zones and empties the set; a partial only empties it', () => {
    const { root, home } = setup();
    buildMap(root, { now: NOW, homeDir: home });
    edit(root, 'agent/a.ts', 60, daysAgo(1));
    recordResult(root, { kind: 'handoff', zones: [], grades: ['partial'], now: NOW, homeDir: home });
    expect(readFlags(root)).toEqual({});
    expect(uncheckedEdits(root)).toEqual([]);
    edit(root, 'agent/a.ts', 60, daysAgo(0.5));
    recordResult(root, { kind: 'handoff', zones: [], grades: ['miss'], now: NOW, homeDir: home });
    expect(readFlags(root)).toEqual({ agent: ['unreviewed-agent-code'] });
    expect(uncheckedEdits(root)).toEqual([]);
    expect(existsSync(um(root, 'events'))).toBe(false);
  });

  it('skipHandoff flags touched zones and empties the set', () => {
    const { root, home } = setup();
    buildMap(root, { now: NOW, homeDir: home });
    edit(root, 'human/h.ts', 60, daysAgo(1));
    skipHandoff(root, NOW);
    expect(readFlags(root)).toEqual({ human: ['unreviewed-agent-code'] });
    expect(handoffSet(root).zones).toEqual([]);
  });

  it('a session pass clears both flags on its zone; a partial or miss clears nothing', () => {
    const { root, home } = setup();
    for (const z of ['agent', 'human']) {
      markUnverifiable(root, z);
      addFlag(root, z, 'unreviewed-agent-code');
    }
    recordResult(root, { kind: 'session', zones: ['human'], grades: ['partial'], now: NOW, homeDir: home });
    recordResult(root, { kind: 'session', zones: ['human'], grades: ['miss'], now: NOW, homeDir: home });
    expect(readFlags(root).human).toEqual(['hard-to-verify', 'unreviewed-agent-code']);
    recordResult(root, { kind: 'session', zones: ['agent'], grades: ['pass', 'pass'], now: NOW, homeDir: home });
    expect(readFlags(root)).toEqual({ human: ['hard-to-verify', 'unreviewed-agent-code'] });
  });

  it('a handoff pass clears unreviewed-agent-code (only) on the touched zones', () => {
    const { root, home } = setup();
    buildMap(root, { now: NOW, homeDir: home });
    for (const z of ['agent', 'human']) {
      markUnverifiable(root, z);
      addFlag(root, z, 'unreviewed-agent-code');
    }
    edit(root, 'agent/a.ts', 60, daysAgo(1));
    recordResult(root, { kind: 'handoff', zones: [], grades: ['pass', 'pass'], now: NOW, homeDir: home });
    expect(readFlags(root)).toEqual({ agent: ['hard-to-verify'], human: ['hard-to-verify', 'unreviewed-agent-code'] });
  });

  it('removeFlag removes one flag and drops a zone with none left', () => {
    const { root } = setup();
    addFlag(root, 'agent', 'hard-to-verify');
    removeFlag(root, 'agent', 'unreviewed-agent-code');
    expect(readFlags(root)).toEqual({ agent: ['hard-to-verify'] });
    removeFlag(root, 'agent', 'hard-to-verify');
    expect(readFlags(root)).toEqual({});
  });

  it('markUnverifiable adds hard-to-verify', () => {
    const { root } = setup();
    markUnverifiable(root, 'agent');
    expect(readFlags(root)).toEqual({ agent: ['hard-to-verify'] });
  });
});

describe('last learn session', () => {
  it.each([['pass', 'pass'], ['partial', 'partial'], ['miss', 'miss']] as const)('a session (%s) writes local/last-learn.json with the zone and date', (g1, g2) => {
    const { root, home } = setup();
    expect(readLastLearn(root)).toBeNull();
    recordResult(root, { kind: 'session', zones: ['agent'], grades: [g1, g2], now: NOW, homeDir: home });
    expect(JSON.parse(readFileSync(um(root, 'local', 'last-learn.json'), 'utf8'))).toEqual({ zone: 'agent', date: NOW.toISOString() });
    expect(readLastLearn(root)).toEqual({ zone: 'agent', date: NOW.toISOString() });
  });

  it('a failure to write it never stops the session from being recorded', () => {
    const { root, home } = setup();
    mkdirSync(um(root, 'local', 'last-learn.json'), { recursive: true });
    const r = recordResult(root, { kind: 'session', zones: ['agent'], grades: ['pass', 'pass'], now: NOW, homeDir: home });
    expect(r.result).toBe('pass');
    expect(lines(um(root, 'events', 'dev.jsonl'))).toHaveLength(1);
  });

  it('a handoff never writes it, and a malformed file reads as null', () => {
    const { root, home } = setup();
    edit(root, 'agent/a.ts', 60, daysAgo(1));
    recordResult(root, { kind: 'handoff', zones: [], grades: ['pass'], now: NOW, homeDir: home });
    expect(existsSync(um(root, 'local', 'last-learn.json'))).toBe(false);
    writeFileSync(um(root, 'local', 'last-learn.json'), '{"zone": 3}');
    expect(readLastLearn(root)).toBeNull();
  });
});
