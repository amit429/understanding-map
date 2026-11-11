import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
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

describe('formatSummary', () => {
  it('shows counts, a numbered top list with reasons, the estimate note and the next command', () => {
    const m = buildMap(fixture(), { now: NOW, homeDir: emptyHome() });
    const s = formatSummary(m, null);
    expect(s).toContain('Owned 1 · Fading 0 · Dark 1 · Unknown 1');
    expect(s).toMatch(/^\s*1\. agent — Dark/m);
    expect(s).toContain('Scores are estimates from git history and sessions');
    expect(s).toContain('/understanding-map:learn');
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
