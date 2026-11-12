import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderReport, writeReport } from '../src/report';
import * as W from '../src/weights';
import type { Evidence, MapResult, PersonLevel, ZoneResult, ZoneState } from '../src/types';

function zone(id: string, state: ZoneState, people: PersonLevel[], over: Partial<ZoneResult> = {}): ZoneResult {
  return {
    zone: { id, files: [`${id}/a.ts`], loc: 400, fingerprint: {} }, state, people, agentShare: 0.42,
    criticality: { score: 50, fanIn: 3, churn90: 2, loc: 400, fixes90: 0, tagged: false },
    darkness: 0.5, danger: 30, reason: `reason for ${id}`, flags: [], ...over,
  };
}
const person = (handle: string, level: number, active: boolean, evidence: Evidence[] = [{ kind: 'human-commits', text: `ev of ${handle}` }]): PersonLevel =>
  ({ handle, level, active, evidence });

function result(mode: 'solo' | 'team', zones: ZoneResult[]): MapResult {
  const counts = { owned: 0, fragile: 0, fading: 0, dark: 0, unknown: 0 };
  for (const z of zones) counts[z.state]++;
  return { mode, generatedAt: '2026-11-12T00:00:00.000Z', me: 'me', zones, top: [], unclearCritical: [], counts };
}

const data = (html: string) => {
  const m = html.match(/<script type="application\/json" id="data">([\s\S]*?)<\/script>/);
  return JSON.parse(m![1]);
};

const team = result('team', [
  zone('src/core', 'owned', [person('amy', 80, true), person('bob', 70, false), person('cy', 20, true)]),
  zone('src/ui', 'dark', [person('amy', 10, true)]),
  zone('docs', 'unknown', []),
]);

describe('renderReport', () => {
  it('lists every zone with a copyable learn command and the estimates sentence', () => {
    const html = renderReport(team);
    for (const id of ['src/core', 'src/ui', 'docs']) expect(html).toContain(id);
    expect(html).toContain('/understanding-map:learn');
    expect(html).toContain('Scores are estimates');
    expect(html).toContain('navigator.clipboard');
    expect(html.match(/class="tile /g)!.length).toBe(3);
  });

  it('embeds evidence, understoodBy (active, at threshold) and leftInactive, never a person agent fraction', () => {
    const d = data(renderReport(team));
    const core = d.zones.find((z: { id: string }) => z.id === 'src/core');
    expect(core.understoodBy).toEqual(['amy']);
    expect(core.leftInactive).toEqual(['bob']);
    expect(core.people.map((p: { handle: string }) => p.handle)).toContain('cy');
    expect(JSON.stringify(core.people)).toContain('ev of amy');
    expect(core.agentShare).toBe(0.42);
    for (const p of core.people) expect(Object.keys(p).sort()).toEqual(['active', 'evidence', 'handle', 'level']);
  });

  it('uses a custom threshold for understoodBy', () => {
    const d = data(renderReport(result('team', [zone('z', 'fragile', [person('amy', 50, true), person('cy', 20, true)])]), { threshold: 40 }));
    expect(d.threshold).toBe(40);
    expect(d.zones[0].understoodBy).toEqual(['amy']);
    expect(data(renderReport(team)).zones[0].understoodBy).toEqual(['amy']);
  });

  it('in solo mode lists only my evidence and no team arrays content', () => {
    const d = data(renderReport(result('solo', [zone('x', 'owned', [person('me', 90, true), person('other', 90, true)])])));
    expect(d.zones[0].people.map((p: { handle: string }) => p.handle)).toEqual(['me']);
    expect(d.zones[0].understoodBy).toEqual([]);
  });

  it('is self-contained: no external src/href, @import or url(http)', () => {
    const html = renderReport(team);
    expect(html).not.toMatch(/(src|href)\s*=\s*["']?\s*(https?:)?\/\//i);
    expect(html).not.toContain('@import');
    expect(html).not.toMatch(/url\(\s*["']?https?:/i);
    expect(html).not.toMatch(/https?:\/\//);
  });

  it('escapes hostile zone ids, reasons, evidence and handles in markup and JSON', () => {
    const evil = '</script><b>x';
    const html = renderReport(result('team', [zone(evil, 'owned', [person('<i>h', 90, true, [{ kind: 'pass', text: '<b>e' }])], { reason: '<b>r' })]));
    expect(html).not.toContain('<b>');
    expect(html).not.toContain('<i>');
    expect(html.match(/<script type="application\/json"/g)!.length).toBe(1);
    const d = data(html);
    expect(d.zones[0].id).toBe(evil);
    expect(d.zones[0].people[0].evidence[0].text).toBe('<b>e');
    expect(html).toContain('&lt;/script&gt;&lt;b&gt;x');
  });

  it('defines CSS custom properties on :root and a dark-mode override', () => {
    const html = renderReport(team);
    expect(html).toMatch(/:root\s*{[^}]*--bg:/);
    expect(html).toMatch(/prefers-color-scheme:\s*dark/);
    expect(html).toContain('name="viewport"');
  });

  it('documents how estimates work, with numbers taken from the weights and the config', () => {
    const section = (html: string) => html.slice(html.indexOf('<h2>How estimates work</h2>'), html.indexOf('</section>', html.indexOf('<h2>How estimates work</h2>')));
    const t = section(renderReport(team, { threshold: 70, fadingFloor: 25, halfLifeDays: 120, activeDays: 60 }));
    expect(t).toContain(`starts at ${W.HUMAN_BASE}`);
    expect(t).toContain(`up to +${W.HUMAN_SHARE_MAX}`);
    expect(t).toContain(`${W.AGENT_PENALTY} ×`);
    expect(t).toContain('halves every 120 days');
    expect(t).toContain(`max(current, ${W.SESSION_PASS_LEVEL})`);
    expect(t).toContain(`max(current, ${W.HANDOFF_PASS_LEVEL})`);
    expect(t).toContain(`max(current, ${W.PARTIAL_LEVEL})`);
    expect(t).toContain(`up to +${W.REVIEW_MAX}`);
    expect(t).toContain('70 or more');
    expect(t).toContain('25 or more');
    expect(t).toContain('last 60 days');
    expect(t).toContain('Fragile');
    const solo = section(renderReport(result('solo', [])));
    expect(solo).toContain('halves every 180 days');
    expect(solo).toContain('60 or more');
    expect(solo).not.toContain('Fragile');
  });

  it('renders an empty map without throwing', () => {
    expect(renderReport(result('solo', []))).toContain('Scores are estimates');
  });

  it('writeReport creates .understanding/report.html and returns its path', () => {
    const root = mkdtempSync(join(tmpdir(), 'umap-rep-'));
    const p = writeReport(root, '<html></html>');
    expect(p).toBe(join(root, '.understanding', 'report.html'));
    expect(existsSync(p)).toBe(true);
    expect(readFileSync(p, 'utf8')).toBe('<html></html>');
  });
});
