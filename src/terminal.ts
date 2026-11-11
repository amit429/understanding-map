import type { Config, MapResult, ZoneResult, ZoneState } from './types.js';

const label = (s: ZoneState) => s[0].toUpperCase() + s.slice(1);

export function formatSummary(m: MapResult, reportPath: string | null): string {
  const c = m.counts;
  const counts = m.mode === 'team'
    ? `Owned ${c.owned} · Fragile ${c.fragile} · Fading ${c.fading} · Dark ${c.dark} · Unknown ${c.unknown}`
    : `Owned ${c.owned} · Fading ${c.fading} · Dark ${c.dark} · Unknown ${c.unknown}`;
  const lines = [`Understanding Map — ${m.zones.length} zones (${m.mode} mode)`, counts, ''];
  if (m.top.length) {
    lines.push('Where understanding matters most:');
    m.top.forEach((z, i) => lines.push(`${String(i + 1).padStart(2)}. ${z.zone.id} — ${z.reason}`));
  } else {
    lines.push('Nothing stands out as a risk right now.');
  }
  if (m.unclearCritical.length) {
    lines.push('', 'Critical but not enough evidence yet:');
    for (const z of m.unclearCritical) lines.push(`  ${z.zone.id} — ${z.reason}`);
  }
  lines.push('', 'Scores are estimates from git history and sessions. Run /understanding-map:who <path> to see the evidence.');
  if (reportPath) lines.push(`Report: ${reportPath}`);
  lines.push('Next: /understanding-map:learn');
  return lines.join('\n');
}

export interface WhoOptions { threshold?: number; me?: string }

export function formatWho(z: ZoneResult, mode: Config['mode'], opts: WhoOptions = {}): string {
  const threshold = opts.threshold ?? 60;
  const counted = z.people.filter((p) => (mode === 'team' ? p.active : opts.me !== undefined ? p.handle === opts.me : true));
  const inactive = mode === 'team' ? z.people.filter((p) => !p.active) : [];
  const knowers = counted.filter((p) => p.level >= threshold);

  const lines = [`${z.zone.id} — ${label(z.state)}`, 'Understood by:'];
  if (knowers.length) for (const p of knowers) lines.push(`  ${p.handle}  ${p.level}/100`);
  else lines.push(`  nobody (${label(z.state)})`);

  const evidenceFor = (p: ZoneResult['people'][number]) => {
    lines.push(`  ${p.handle} (${p.level}/100)`);
    for (const e of p.evidence) lines.push(`    - ${e.text}`);
  };
  lines.push('', 'Evidence (estimates from git history and sessions):');
  if (counted.length) counted.forEach(evidenceFor);
  else lines.push(`  nobody has commits, passes or reviews here; ${z.reason}`);

  if (inactive.length) {
    lines.push('', 'left / inactive (not counted toward the state):');
    inactive.forEach(evidenceFor);
  }
  if (z.agentShare > 0) lines.push('', `About ${Math.max(1, Math.round(z.agentShare * 100))}% of this zone was written by agents.`);
  return lines.join('\n');
}
