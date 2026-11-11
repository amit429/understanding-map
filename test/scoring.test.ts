import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG } from '../src/config';
import { personLevels, scoreMap, type ScoreInputs } from '../src/scoring';
import type { Commit, Config, PassEvent, PersonLevel, Zone } from '../src/types';

const DAY = 86_400_000;
const NOW = new Date('2026-11-12T12:00:00Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * DAY);
const iso = (n: number) => daysAgo(n).toISOString();

function mkZone(id: string, files: string[], loc: number, hashes: Record<string, string> = {}): Zone {
  return { id, files, loc, fingerprint: Object.fromEntries(files.map((f) => [f, hashes[f] ?? `h-${f}`])) };
}

function mkCommit(sha: string, who: string, days: number, files: Array<[string, number]>, message = 'work'): Commit {
  return {
    sha, email: `${who}@x.dev`, date: daysAgo(days), message, agentTrailer: false,
    files: files.map(([path, added]) => ({ path, added, deleted: 0 })),
  };
}

function inputs(over: Partial<Omit<ScoreInputs, 'config'>> & { config?: Partial<Config> } = {}): ScoreInputs {
  const { config, ...rest } = over;
  return {
    config: { ...structuredClone(DEFAULT_CONFIG), ...config },
    now: NOW, me: 'me', handleOf: (e) => e.split('@')[0],
    zones: [], commits: [], agentLines: new Map(), sharedAgentShare: {},
    passes: new Map(), localPartials: [], fanIn: {}, reviews: {}, flags: {},
    ...rest,
  };
}

const core = mkZone('core', ['core/a.ts', 'core/b.ts'], 500);
const docs = mkZone('docs', ['docs/x.md'], 200);
const pass = (zone: Zone, level: number, days: number, fp = zone.fingerprint): PassEvent =>
  ({ zone: zone.id, level, fingerprint: fp, date: iso(days), kind: 'session' });

const person = (people: PersonLevel[], handle: string) => people.find((p) => p.handle === handle)!;
const result = (inp: ScoreInputs, id: string) => scoreMap(inp).zones.find((z) => z.zone.id === id)!;

describe('solo mode', () => {
  it('1. all agent-written code is dark', () => {
    const c = mkCommit('c1', 'me', 1, [['core/a.ts', 500]]);
    const inp = inputs({ zones: [core], commits: [c], agentLines: new Map([['c1', new Map([['core/a.ts', 500]])]]) });
    const z = result(inp, 'core');
    expect(Math.abs(person(z.people, 'me').level - 20)).toBeLessThanOrEqual(1);
    expect(z.state).toBe('dark');
    expect(person(z.people, 'me').evidence.map((e) => e.kind)).toContain('agent-share');
  });

  it('2. human-written and recent is owned', () => {
    const inp = inputs({ zones: [core], commits: [mkCommit('c1', 'me', 1, [['core/a.ts', 500]])] });
    const z = result(inp, 'core');
    const me = person(z.people, 'me');
    expect(Math.abs(me.level - 70)).toBeLessThanOrEqual(1);
    expect(z.state).toBe('owned');
    expect(me.evidence[0]).toEqual({ kind: 'human-commits', text: 'added ~500 lines here; last commit 1 day ago' });
  });

  it('3. human-written 200 days ago fades while I am still active elsewhere', () => {
    const commits = [mkCommit('c2', 'me', 5, [['docs/x.md', 10]]), mkCommit('c1', 'me', 200, [['core/a.ts', 500]])];
    const z = result(inputs({ zones: [core, docs], commits }), 'core');
    const me = person(z.people, 'me');
    expect(Math.abs(me.level - 32)).toBeLessThanOrEqual(1);
    expect(me.active).toBe(true);
    expect(me.evidence.map((e) => e.kind)).toContain('decay-time');
    expect(z.state).toBe('fading');
  });

  it('applies no time decay when halfLifeDays <= 0, and never yields NaN', () => {
    const commits = [mkCommit('c2', 'me', 5, [['docs/x.md', 10]]), mkCommit('c1', 'me', 200, [['core/a.ts', 500]])];
    const empty = mkZone('empty', [], 0);
    const inp = inputs({ config: { halfLifeDays: 0 }, zones: [core, docs, empty], commits });
    const r = scoreMap(inp);
    expect(person(r.zones.find((z) => z.zone.id === 'core')!.people, 'me').level).toBe(70);
    for (const z of r.zones) {
      expect(Number.isNaN(z.criticality.score) || Number.isNaN(z.danger)).toBe(false);
      for (const p of z.people) expect(Number.isFinite(p.level)).toBe(true);
    }
  });

  it('counts me for the state even when I am inactive (R11)', () => {
    const z = result(inputs({ zones: [core], commits: [mkCommit('c1', 'me', 120, [['core/a.ts', 500]])] }), 'core');
    const me = person(z.people, 'me');
    expect(me.active).toBe(false);
    expect(Math.abs(me.level - 44)).toBeLessThanOrEqual(1);
    expect(z.state).toBe('fading');
  });
});

describe('team mode', () => {
  const team = { mode: 'team' as const };

  it('4. two active people at or above the threshold own a zone; one makes it fragile', () => {
    const big = mkZone('core', ['core/a.ts', 'core/b.ts'], 1000);
    const owned = inputs({ config: team, zones: [big], commits: [
      mkCommit('c1', 'alice', 1, [['core/a.ts', 500]]), mkCommit('c2', 'bob', 1, [['core/b.ts', 500]]),
    ] });
    const oz = result(owned, 'core');
    expect(oz.people.every((p) => p.level >= 60)).toBe(true);
    expect(oz.state).toBe('owned');

    const fragile = inputs({ config: team, zones: [big], commits: [
      mkCommit('c1', 'alice', 1, [['core/a.ts', 500]]), mkCommit('c2', 'bob', 1, [['core/b.ts', 100]]),
    ] });
    expect(result(fragile, 'core').state).toBe('fragile');
  });

  it('5. a zone known only by inactive people is dark', () => {
    const inp = inputs({ config: team, zones: [core], commits: [
      mkCommit('c1', 'alice', 120, [['core/a.ts', 250]]), mkCommit('c2', 'bob', 120, [['core/b.ts', 250]]),
    ] });
    const z = result(inp, 'core');
    expect(z.state).toBe('dark');
    for (const p of z.people) {
      expect(p.active).toBe(false);
      expect(p.evidence.map((e) => e.kind)).toContain('inactive');
    }
  });

  it('6. the shared agent share lowers a teammate and names nobody', () => {
    const commits = [mkCommit('c1', 'bo', 1, [['core/a.ts', 500]])];
    const before = person(personLevels(core, inputs({ config: team, zones: [core], commits })), 'bo');
    expect(Math.abs(before.level - 70)).toBeLessThanOrEqual(1);

    const inp = inputs({ config: team, zones: [core], commits, sharedAgentShare: { core: 0.8 } });
    const z = result(inp, 'core');
    const bo = person(z.people, 'bo');
    expect(Math.abs(bo.level - 30)).toBeLessThanOrEqual(1);
    const share = bo.evidence.find((e) => e.kind === 'agent-share')!;
    expect(share.text).toBe('about 80% of this zone was written by agents');
    expect(share.text).not.toMatch(/\bbo\b/);
    expect(z.state).toBe('fading');
  });

  it('states only the zone-level share, never my own fraction', () => {
    const commits = [mkCommit('c1', 'me', 1, [['core/a.ts', 500]]), mkCommit('c2', 'bo', 1, [['core/b.ts', 500]])];
    const big = mkZone('core', ['core/a.ts', 'core/b.ts'], 1000);
    const inp = inputs({ config: team, zones: [big], commits, agentLines: new Map([['c1', new Map([['core/a.ts', 100]])]]) });
    const z = result(inp, 'core');
    const texts = z.people.flatMap((p) => p.evidence.filter((e) => e.kind === 'agent-share').map((e) => e.text));
    expect(texts).toEqual(['about 10% of this zone was written by agents', 'about 10% of this zone was written by agents']);
    expect(z.agentShare).toBeCloseTo(0.1);
  });

  it('attaches the zone agent share to every teammate, not just those with agent lines (R14)', () => {
    const big = mkZone('core', ['core/a.ts', 'core/b.ts'], 1000);
    const inp = inputs({
      config: team, zones: [big],
      commits: [mkCommit('c1', 'ann', 1, [['core/a.ts', 500]]), mkCommit('c2', 'ben', 1, [['core/b.ts', 500]])],
      agentLines: new Map([['c1', new Map([['core/a.ts', 500]])]]),
    });
    const people = personLevels(big, inp);
    const shareOf = (h: string) => person(people, h).evidence.filter((e) => e.kind === 'agent-share').map((e) => e.text);
    expect(shareOf('ann')).toEqual(['about 50% of this zone was written by agents']);
    expect(shareOf('ben')).toEqual(shareOf('ann'));
    for (const t of [...shareOf('ann'), ...shareOf('ben')]) expect(t).not.toMatch(/\b(ann|ben)\b/);
    expect(person(people, 'ben').level).toBeGreaterThan(person(people, 'ann').level);
  });

  it("uses a teammate's own known agent lines (e.g. trailers) even without a shared share (R12)", () => {
    const inp = inputs({
      config: team, zones: [core], commits: [mkCommit('c1', 'bo', 1, [['core/a.ts', 500]])],
      agentLines: new Map([['c1', new Map([['core/a.ts', 500]])]]),
    });
    expect(Math.abs(person(personLevels(core, inp), 'bo').level - 20)).toBeLessThanOrEqual(1);
  });
});

describe('passes and partials', () => {
  it('7. a pass with an unchanged fingerprint sets the level; changed files decay it', () => {
    const inp = inputs({ zones: [core], passes: new Map([['me', [pass(core, 80, 0)]]]) });
    const z = result(inp, 'core');
    expect(person(z.people, 'me').level).toBe(80);
    expect(z.state).toBe('owned');

    const changed = mkZone('core', ['core/a.ts', 'core/b.ts'], 500, { 'core/b.ts': 'new-hash' });
    const inp2 = inputs({ zones: [changed], passes: new Map([['me', [pass(core, 80, 0)]]]) });
    const me = person(personLevels(changed, inp2), 'me');
    expect(me.level).toBe(40);
    expect(me.evidence.map((e) => e.kind)).toEqual(['pass', 'decay-change']);
  });

  it('weights changed files by lines when fileLoc is given (R10)', () => {
    const w = mkZone('w', ['w/a.ts', 'w/b.ts'], 1000);
    const ev = pass(w, 80, 0, { 'w/a.ts': 'old-hash', 'w/b.ts': w.fingerprint['w/b.ts'] });
    const base = { zones: [w], passes: new Map([['me', [ev]]]) };
    expect(person(personLevels(w, inputs({ ...base, fileLoc: { 'w/a.ts': 900, 'w/b.ts': 100 } })), 'me').level).toBe(8);
    expect(person(personLevels(w, inputs(base)), 'me').level).toBe(40);
  });

  it('8. a local partial applies only to me', () => {
    const inp = inputs({
      config: { mode: 'team' }, zones: [core],
      commits: [mkCommit('c1', 'bo', 1, [['core/a.ts', 50]])],
      localPartials: [pass(core, 50, 0)],
    });
    const people = personLevels(core, inp);
    expect(person(people, 'me').level).toBe(50);
    expect(person(people, 'me').evidence.map((e) => e.kind)).toContain('partial');
    expect(person(people, 'bo').evidence.some((e) => e.kind === 'partial')).toBe(false);
    expect(Math.abs(person(people, 'bo').level - 38)).toBeLessThanOrEqual(1);
  });

  it('a later partial never lowers an earlier pass', () => {
    const inp = inputs({ zones: [core], passes: new Map([['me', [pass(core, 80, 10)]]]), localPartials: [pass(core, 50, 1)] });
    expect(Math.abs(person(personLevels(core, inp), 'me').level - 77)).toBeLessThanOrEqual(1);
  });

  it('sorts events itself and ignores malformed ones', () => {
    const bad = [
      { zone: 'core', level: 'high', date: iso(0), fingerprint: core.fingerprint },
      { zone: 'core', level: 99, date: 'not a date', fingerprint: core.fingerprint },
      { level: 99, date: iso(0) },
      null,
    ] as unknown as PassEvent[];
    const evs = [pass(core, 60, 30), ...bad, pass(core, 80, 0), pass(core, 70, 20)];
    const inp = inputs({ zones: [core], passes: new Map([['me', evs]]) });
    expect(person(personLevels(core, inp), 'me').level).toBe(80);
  });
});

describe('ranking', () => {
  it('9. an unknown critical zone is listed as unclear, not ranked', () => {
    const u = mkZone('u', ['u/a.ts'], 1000);
    const a = mkZone('a', ['a/a.ts'], 2000);
    const b = mkZone('b', ['b/a.ts'], 50);
    const inp = inputs({
      config: { mode: 'team' }, zones: [u, a, b], fanIn: { u: 20, a: 5 }, sharedAgentShare: { u: 0.3 },
      commits: [mkCommit('c1', 'me', 5, [['a/a.ts', 2000]], 'add feature'), mkCommit('c2', 'bo', 10, [['u/a.ts', 10]], 'fix crash')],
    });
    const r = scoreMap(inp);
    const uz = r.zones.find((z) => z.zone.id === 'u')!;
    expect(uz.state).toBe('unknown');
    expect(uz.criticality.score).toBeCloseTo(0.95);
    expect(r.top.map((z) => z.zone.id)).not.toContain('u');
    expect(r.unclearCritical.map((z) => z.zone.id)).toEqual(['u']);
    expect(r.top.map((z) => z.zone.id)).toEqual(['a']);
  });

  it('10. a tagged-critical zone outranks an otherwise identical one', () => {
    const x = mkZone('x', ['x/a.ts'], 500);
    const y = mkZone('y', ['y/a.ts'], 500);
    const agent = new Map([['c1', new Map([['x/a.ts', 500]])], ['c2', new Map([['y/a.ts', 500]])]]);
    const inp = inputs({
      config: { critical: ['y/**'] }, zones: [x, y], agentLines: agent,
      commits: [mkCommit('c1', 'me', 1, [['x/a.ts', 500]]), mkCommit('c2', 'me', 1, [['y/a.ts', 500]])],
    });
    const r = scoreMap(inp);
    expect(r.top.map((z) => z.zone.id)).toEqual(['y', 'x']);
    expect(r.top[0].criticality.tagged).toBe(true);
    expect(r.top[0].criticality.score).toBeCloseTo(r.top[1].criticality.score + 1);
    expect(r.top[0].reason).toBe('Dark · tagged critical');
  });

  it('11. builds a plain reason string', () => {
    const agent = new Map(['c1', 'c2', 'c3', 'c4'].map((s) => [s, new Map([['core/a.ts', 100]])]));
    const commits = [
      mkCommit('c1', 'me', 1, [['core/a.ts', 100]], 'fix: crash'),
      mkCommit('c2', 'me', 2, [['core/a.ts', 100]], 'Bug in parser'),
      mkCommit('c3', 'me', 3, [['core/a.ts', 100]], 'feat: thing\n\nhotfix for prod'),
      mkCommit('c4', 'me', 120, [['core/a.ts', 100]], 'fix: old'),
    ];
    const inp = inputs({ zones: [core], commits, agentLines: agent, fanIn: { core: 14 } });
    const z = result(inp, 'core');
    expect(z.state).toBe('dark');
    expect(z.reason).toBe('Dark · 14 files import it · 3 fixes in the last 90 days');
    expect(z.criticality).toMatchObject({ fanIn: 14, churn90: 3, fixes90: 3, loc: 500, tagged: false, score: 1 });
  });

  it('uses the singular for one import and one fix', () => {
    const inp = inputs({
      zones: [core], fanIn: { core: 1 }, agentLines: new Map([['c1', new Map([['core/a.ts', 100]])]]),
      commits: [mkCommit('c1', 'me', 1, [['core/a.ts', 100]], 'revert x')],
    });
    expect(result(inp, 'core').reason).toBe('Dark · 1 file imports it · 1 fix in the last 90 days');
  });

  it('reports every state in counts, the mode and the time', () => {
    const r = scoreMap(inputs({ zones: [core, docs], commits: [mkCommit('c1', 'me', 1, [['core/a.ts', 500]])] }));
    expect(r.counts).toEqual({ owned: 1, fragile: 0, fading: 0, dark: 0, unknown: 1 });
    expect(r).toMatchObject({ mode: 'solo', me: 'me', generatedAt: NOW.toISOString() });
    expect(r.top.map((z) => z.zone.id)).toEqual(['core']);
  });

  it('carries flags into the result and my evidence without changing scores', () => {
    const commits = [mkCommit('c1', 'me', 1, [['core/a.ts', 500]])];
    const plain = result(inputs({ zones: [core], commits }), 'core');
    const flagged = result(inputs({ zones: [core], commits, flags: { core: ['unreviewed-agent-code'] } }), 'core');
    expect(flagged.flags).toEqual(['unreviewed-agent-code']);
    expect(person(flagged.people, 'me').evidence.map((e) => e.kind)).toContain('flag');
    expect(person(flagged.people, 'me').level).toBe(person(plain.people, 'me').level);
    expect(flagged.danger).toBe(plain.danger);
  });
});
