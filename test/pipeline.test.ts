import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { appendEdit } from '../src/editlog';
import { buildMap } from '../src/pipeline';
import { formatSummary, formatWho } from '../src/terminal';
import { body, daysAgo, emptyHome, fixture, NOW } from './helpers/fixture';
import { gitIn, makeRepo } from './helpers/repo';

describe('buildMap', () => {
  it('maps an agent zone to dark, a human zone to owned and an untouched zone to unknown (solo)', () => {
    const root = fixture();
    const m = buildMap(root, { now: NOW, homeDir: emptyHome() });
    const state = (id: string) => m.zones.find((z) => z.zone.id === id)?.state;
    expect(state('agent')).toBe('dark');
    expect(state('human')).toBe('owned');
    expect(state('old')).toBe('unknown');
    expect(m.counts).toMatchObject({ owned: 1, dark: 1, unknown: 1, fading: 0 });
    expect(existsSync(join(root, '.understanding', 'local', 'zones-cache.json'))).toBe(true);
  });

  it('team mode shares only private edit-log agent lines, as anonymous zone/week totals', () => {
    const root = fixture(true);
    appendEdit(root, { file: 'human/h.ts', ranges: [], lines: 100, session: 's', ts: daysAgo(6) });
    const m = buildMap(root, { now: NOW, homeDir: emptyHome() });
    const dir = join(root, '.understanding', 'agent-share');
    const [file] = readdirSync(dir);
    const rows = readFileSync(join(dir, file), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    expect(rows).toHaveLength(1); // the trailer-only agent/ zone is public, so it is not shared
    expect(Object.keys(rows[0]).sort()).toEqual(['agentLines', 'week', 'zone']);
    expect(rows[0]).toMatchObject({ zone: 'human', agentLines: 100 });
    expect(m.zones.find((z) => z.zone.id === 'human')!.agentShare).toBeCloseTo(0.5);
  });
});

describe('buildMap reviews', () => {
  it('folds per-path review counts into zone review evidence', () => {
    const root = fixture();
    const m = buildMap(root, { now: NOW, homeDir: emptyHome(), reviewsByPath: { 'human/h.ts': { Dev: 3 }, 'nowhere.ts': { Dev: 9 } } });
    const dev = m.zones.find((z) => z.zone.id === 'human')!.people.find((p) => p.handle === 'dev');
    expect(dev?.evidence.some((e) => e.kind === 'review' && e.text.includes('3'))).toBe(true);
  });

  it('counts a reviewer only when their login maps to a handle or matches a committer', () => {
    const root = makeRepo([{ files: { 'src/auth/a.ts': body('a') }, email: 'alice@example.com', date: daysAgo(5) }]);
    gitIn(root, ['config', 'user.email', 'alice@example.com']);
    const reviewsByPath = { 'src/auth/a.ts': { 'alice-gh': 3, constructor: 2 } };
    const zone = (m: ReturnType<typeof buildMap>) => m.zones.find((z) => z.zone.id === 'src/auth')!;
    const plain = zone(buildMap(root, { now: NOW, homeDir: emptyHome() }));
    const unmapped = zone(buildMap(root, { now: NOW, homeDir: emptyHome(), reviewsByPath }));
    expect(unmapped.people.map((p) => p.handle)).toEqual(['alice']);
    expect(unmapped.state).toBe(plain.state);
    expect(unmapped.people[0].evidence.some((e) => e.kind === 'review')).toBe(false);

    mkdirSync(join(root, '.understanding'), { recursive: true });
    writeFileSync(join(root, '.understanding', 'config.json'), JSON.stringify({ handles: { 'alice-gh': 'alice' } }));
    const mapped = zone(buildMap(root, { now: NOW, homeDir: emptyHome(), reviewsByPath }));
    expect(mapped.people.map((p) => p.handle)).toEqual(['alice']);
    expect(mapped.people[0].evidence.find((e) => e.kind === 'review')?.text).toBe('reviewed 3 changes here');
  });
});

describe('buildMap review cache', () => {
  it('reads the review cache by default only when githubReviews is on', () => {
    const root = fixture();
    mkdirSync(join(root, '.understanding', 'local'), { recursive: true });
    writeFileSync(join(root, '.understanding', 'local', 'reviews-cache.json'),
      JSON.stringify({ fetchedAt: new Date().toISOString(), counts: { 'human/h.ts': { dev: 2 } } }));
    const reviewed = () => buildMap(root, { now: NOW, homeDir: emptyHome() }).zones.find((z) => z.zone.id === 'human')!
      .people.find((p) => p.handle === 'dev')!.evidence.some((e) => e.kind === 'review');
    expect(reviewed()).toBe(false);
    writeFileSync(join(root, '.understanding', 'config.json'), JSON.stringify({ githubReviews: true }));
    expect(reviewed()).toBe(true);
  });
});

describe('buildMap fixes', () => {
  it("never attributes my private agent edits to someone else's commit", () => {
    const root = makeRepo([
      { files: { 'src/f.ts': body('a') }, email: 'alice@example.com', date: daysAgo(10) },
      { files: { 'src/f.ts': body('a') + body('b', 100) }, email: 'bob@example.com', date: daysAgo(5) },
    ]);
    gitIn(root, ['config', 'user.email', 'alice@example.com']);
    appendEdit(root, { file: 'src/f.ts', ranges: [], lines: 100, session: 's', ts: daysAgo(6) });
    const z = buildMap(root, { now: NOW, homeDir: emptyHome() }).zones.find((x) => x.zone.id === 'src')!;
    expect(z.agentShare).toBe(0);
    for (const p of z.people) expect(p.evidence.some((e) => e.kind === 'agent-share')).toBe(false);
  });

  it('does not double-count backfilled edits from sessions the live log already has', () => {
    const root = fixture();
    const home = emptyHome();
    const dir = join(home, '.claude', 'projects', root.replace(/[^A-Za-z0-9-]/g, '-'));
    mkdirSync(dir, { recursive: true });
    const rec = (session: string, n: number) => JSON.stringify({
      type: 'assistant', timestamp: daysAgo(6), sessionId: session,
      message: { content: [{ type: 'tool_use', name: 'Write', input: { file_path: join(root, 'human/h.ts'), content: body('x', n).trimEnd() } }] },
    });
    writeFileSync(join(dir, 's.jsonl'), [rec('S', 100), rec('T', 50)].join('\n') + '\n');
    appendEdit(root, { file: 'human/h.ts', ranges: [], lines: 100, session: 'S', ts: daysAgo(6) });
    const m = buildMap(root, { now: NOW, homeDir: home });
    expect(m.zones.find((z) => z.zone.id === 'human')!.agentShare).toBeCloseTo(0.75); // 100 live + 50 from T, not 250
  });

  it('falls back to "me" when git user.email is unset', () => {
    vi.stubEnv('GIT_CONFIG_GLOBAL', '/dev/null');
    vi.stubEnv('GIT_CONFIG_SYSTEM', '/dev/null');
    const root = makeRepo([{ files: { 'a/a.ts': body('a') }, date: daysAgo(5) }]);
    expect(buildMap(root, { now: NOW, homeDir: emptyHome() }).me).toBe('me');
    vi.unstubAllEnvs();
  });
});

describe('formatSummary', () => {
  it('shows counts, a numbered top list with reasons, the estimate note and the next command', () => {
    const m = buildMap(fixture(), { now: NOW, homeDir: emptyHome() });
    const s = formatSummary(m, null);
    expect(s).toContain('Owned 1 · Fading 0 · Dark 1 · Unknown 1');
    expect(s).toMatch(/^\s*1\. agent — Dark/m);
    expect(s).toContain('Scores are estimates from git history and sessions');
    expect(s).toContain('/understanding-map:learn');
  });

  it('says there is nothing to map yet, without suggesting learn, when there are no zones', () => {
    for (const root of [makeRepo([]), makeRepo([{ files: { 'dist/bundle.js': body('d') } }])]) {
      const s = formatSummary(buildMap(root, { now: NOW, homeDir: emptyHome() }), null);
      expect(s).toContain('No tracked files yet — commit some code, then run map again.');
      expect(s).not.toContain('Next:');
      expect(s).not.toContain('Nothing stands out');
    }
  });
});

describe('formatWho', () => {
  it('prints nobody (Dark) and the evidence lines for a dark zone', () => {
    const m = buildMap(fixture(), { now: NOW, homeDir: emptyHome() });
    const out = formatWho(m.zones.find((z) => z.zone.id === 'agent')!, 'solo', { me: m.me });
    expect(out).toContain('nobody (Dark)');
    expect(out).toContain('written by agents');
  });

  it('lists inactive people under left / inactive and does not count them (team)', () => {
    const root = makeRepo([
      { files: { 'core/a.ts': body('a') }, email: 'bob@example.com', date: daysAgo(300) },
      { files: { 'other/x.ts': body('x') }, email: 'alice@example.com', date: daysAgo(2) },
    ]);
    gitIn(root, ['config', 'user.email', 'alice@example.com']);
    mkdirSync(join(root, '.understanding'), { recursive: true });
    writeFileSync(join(root, '.understanding', 'config.json'), JSON.stringify({ mode: 'team' }));
    const m = buildMap(root, { now: NOW, homeDir: emptyHome() });
    const z = m.zones.find((x) => x.zone.id === 'core')!;
    expect(z.state).toBe('dark');
    const out = formatWho(z, 'team');
    expect(out).toContain('nobody (Dark)');
    expect(out).toMatch(/left \/ inactive[\s\S]*bob/);
    expect(out.split('left / inactive')[0]).not.toContain('bob');
  });
});
