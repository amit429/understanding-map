import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { hierarchy, treemap, treemapSquarify } from 'd3-hierarchy';
import { DEFAULT_CONFIG } from './config.js';
import { howEstimatesWork, REPORT_TEMPLATE, type MethodSettings } from './report-template.js';
import type { MapResult, ZoneResult, ZoneState } from './types.js';

interface Node { name: string; zone?: ZoneResult; children?: Node[] }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const label = (s: ZoneState) => s[0].toUpperCase() + s.slice(1);

/** Nests zones by path segment; a zone that is also a parent of other zones becomes a leaf of its own. */
function buildTree(zones: ZoneResult[]): Node {
  const root: Node = { name: '', children: [] };
  for (const z of zones) {
    let cur = root;
    for (const seg of z.zone.id.split('/').filter(Boolean)) {
      cur.children ??= [];
      let next = cur.children.find((c) => c.name === seg && !c.zone);
      if (!next) { next = { name: seg }; cur.children.push(next); }
      cur = next;
    }
    if (cur.children?.length) cur.children.push({ name: cur.name, zone: z });
    else cur.zone = z;
  }
  return root;
}

function renderTreemap(zones: ZoneResult[]): string {
  if (!zones.length) return '';
  const root = hierarchy(buildTree(zones)).sum((n) => (n.zone ? Math.max(n.zone.zone.loc, 1) : 0));
  const laid = treemap<Node>().size([100, 100]).tile(treemapSquarify).paddingInner(0.2)(root);
  return laid.leaves().map((l) => {
    const z = l.data.zone!;
    const w = l.x1 - l.x0;
    const h = l.y1 - l.y0;
    const text = w >= 9 && h >= 7 ? esc(z.zone.id) : '';
    const title = esc(`${z.zone.id} — ${label(z.state)} · ${z.zone.loc} lines`);
    const pos = `left:${l.x0.toFixed(3)}%;top:${l.y0.toFixed(3)}%;width:${w.toFixed(3)}%;height:${h.toFixed(3)}%`;
    return `<div class="tile s-${z.state}" role="button" tabindex="0" data-id="${esc(z.zone.id)}" title="${title}" style="${pos}">${text}</div>`;
  }).join('\n');
}

function renderTable(zones: ZoneResult[]): string {
  return [...zones].sort((a, b) => b.danger - a.danger || a.zone.id.localeCompare(b.zone.id)).map((z) =>
    `<tr data-id="${esc(z.zone.id)}" tabindex="0"><td class="zid">${esc(z.zone.id)}</td>` +
    `<td><span class="badge s-${z.state}">${label(z.state)}</span></td><td>${z.zone.loc}</td><td>${esc(z.reason)}</td></tr>`).join('\n');
}

function renderHeader(m: MapResult): string {
  const c = m.counts;
  const states: ZoneState[] = m.mode === 'team' ? ['owned', 'fragile', 'fading', 'dark', 'unknown'] : ['owned', 'fading', 'dark', 'unknown'];
  const chips = states.map((s) => `<li><span class="dot s-${s}"></span>${label(s)} ${c[s]}</li>`).join('');
  return `<p class="meta">${esc(m.mode)} mode · generated ${esc(m.generatedAt)} · ${m.zones.length} zones</p>\n` +
    `<ul class="counts">${chips}</ul>\n` +
    `<p class="note">Scores are estimates from git history and sessions — each one lists its evidence.</p>`;
}

/** Embedded data. Agent share appears only at zone level, never per person. */
function reportData(m: MapResult, threshold: number) {
  const team = m.mode === 'team';
  return {
    mode: m.mode,
    generatedAt: m.generatedAt,
    threshold,
    zones: m.zones.map((z) => {
      const listed = team ? z.people : z.people.filter((p) => p.handle === m.me);
      return {
        id: z.zone.id,
        state: z.state,
        loc: z.zone.loc,
        agentShare: z.agentShare,
        criticality: z.criticality,
        danger: z.danger,
        reason: z.reason,
        flags: z.flags,
        people: listed.map((p) => ({ handle: p.handle, level: p.level, active: p.active, evidence: p.evidence })),
        understoodBy: team ? z.people.filter((p) => p.active && p.level >= threshold).map((p) => p.handle) : [],
        leftInactive: team ? z.people.filter((p) => !p.active).map((p) => p.handle) : [],
      };
    }),
  };
}

const safeJson = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

export function renderReport(m: MapResult, opts: Partial<MethodSettings> = {}): string {
  const settings: MethodSettings = {
    threshold: opts.threshold ?? DEFAULT_CONFIG.threshold,
    fadingFloor: opts.fadingFloor ?? DEFAULT_CONFIG.fadingFloor,
    halfLifeDays: opts.halfLifeDays ?? DEFAULT_CONFIG.halfLifeDays,
    activeDays: opts.activeDays ?? DEFAULT_CONFIG.activeDays,
  };
  const fill: Record<string, string> = {
    __HEADER__: renderHeader(m),
    __TREEMAP__: renderTreemap(m.zones),
    __TABLE__: renderTable(m.zones),
    __DATA__: safeJson(reportData(m, settings.threshold)),
    __METHOD__: howEstimatesWork(m.mode, settings),
  };
  return REPORT_TEMPLATE.replace(/__(HEADER|TREEMAP|TABLE|DATA|METHOD)__/g, (k) => fill[k]);
}

export function writeReport(root: string, html: string): string {
  const dir = join(root, '.understanding');
  mkdirSync(dir, { recursive: true });
  const path = join(dir, 'report.html');
  writeFileSync(path, html);
  return path;
}
