import type { Config } from './types.js';
import {
  AGENT_PENALTY, CRIT, DARK_AGENT_SHARE, DARKNESS, HANDOFF_PASS_LEVEL, HUMAN_BASE, HUMAN_SHARE_MAX, HUMAN_SHARE_MULT,
  PARTIAL_LEVEL, RECENT_DAYS, REVIEW_MAX, REVIEW_PER, SESSION_PASS_LEVEL,
} from './weights.js';

export type MethodSettings = Pick<Config, 'threshold' | 'fadingFloor' | 'halfLifeDays' | 'activeDays'>;

/** The "How estimates work" list (spec §7.1: weights documented in the report), built from weights.ts and config. */
export function howEstimatesWork(mode: Config['mode'], s: MethodSettings): string {
  const pct = (f: number) => `${Math.round(f * 100)}%`;
  const states = mode === 'team'
    ? `Owned: 2 or more active people at ${s.threshold} or more. Fragile: exactly one. ` +
      `Fading: nobody active at ${s.threshold}, but someone active at ${s.fadingFloor} or more. ` +
      `Dark: nobody active at ${s.fadingFloor} or more, and at least ${pct(DARK_AGENT_SHARE)} of the zone is agent-written ` +
      `or everyone with evidence here is inactive. Unknown: not enough evidence either way. ` +
      `Active means a commit or a pass in this repository in the last ${s.activeDays} days.`
    : `Owned: your level is ${s.threshold} or more. Fading: ${s.fadingFloor} or more. ` +
      `Dark: there is evidence, but your level is below ${s.fadingFloor}. Unknown: no evidence yet.`;
  const darkness = (mode === 'team' ? ['dark', 'fading', 'fragile', 'owned'] as const : ['dark', 'fading', 'owned'] as const)
    .map((k) => `${k[0].toUpperCase()}${k.slice(1)} ${DARKNESS[k]}`).join(', ');
  const items = [
    `<strong>Commits.</strong> Anyone who committed to a zone starts at ${HUMAN_BASE}, plus up to +${HUMAN_SHARE_MAX} for authorship ` +
      `(${HUMAN_SHARE_MULT} × the lines they added ÷ the zone's lines of code), minus ${AGENT_PENALTY} × the fraction of their lines written by agents.`,
    `<strong>Code changed since.</strong> That level is multiplied by 1 − (lines others added after their last commit ÷ the zone's lines of code).`,
    `<strong>Time.</strong> Evidence counts for less as it ages: it halves every ${s.halfLifeDays} days.`,
    `<strong>Sessions and handoff checks.</strong> A passed learning session sets your level to max(current, ${SESSION_PASS_LEVEL}); ` +
      `a passed handoff check sets each touched zone to max(current, ${HANDOFF_PASS_LEVEL}); a partly passed session sets ` +
      `max(current, ${PARTIAL_LEVEL}) and stays on your machine. These decay with the share of the zone's files changed since, and with time.`,
    `<strong>Reviews.</strong> With the optional PR review signal on, each substantive review comment adds +${REVIEW_PER}, up to +${REVIEW_MAX}.`,
    `A person's level is the highest of these, from 0 to 100.`,
    `<strong>States.</strong> ${states}`,
    `<strong>Ranking.</strong> Danger = darkness × criticality. Darkness: ${darkness}; Unknown zones are not ranked. ` +
      `Criticality adds percentile ranks of fan-in (× ${CRIT.fanIn}), commits in the last ${RECENT_DAYS} days (× ${CRIT.churn}), ` +
      `lines of code (× ${CRIT.loc}) and fixes in the last ${RECENT_DAYS} days (× ${CRIT.fixes}), plus ${CRIT.tagged} for zones tagged critical.`,
  ];
  return `<ul class="method">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
}

/** Colour tokens (light and dark) and state colours shared by report.html and the visualize page. */
export const THEME_CSS = String.raw`:root {
  --bg: #f7f6f2; --surface: #ffffff; --text: #1f2328; --muted: #5c6470; --border: #dcdad2;
  --owned: #2f9e5b; --fragile: #e0a21a; --fading: #f2d38a; --dark: #a11d2b; --unknown: #9aa0a8;
  --on-owned: #ffffff; --on-fragile: #1f2328; --on-fading: #1f2328; --on-dark: #ffffff; --on-unknown: #1f2328;
  --accent: #1f5fbf;
  --font: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #14161a; --surface: #1c1f25; --text: #e6e8eb; --muted: #9aa3ad; --border: #333842;
    --owned: #3fb673; --fragile: #d19a1c; --fading: #8a7442; --dark: #c0392f; --unknown: #5b616b;
    --on-owned: #0c1a12; --on-fragile: #1a1405; --on-fading: #f3ecd9; --on-dark: #ffffff; --on-unknown: #eceef1;
    --accent: #6ea8ff;
  }
}
`;

/** Self-contained report shell. Placeholders (__NAME__) are filled by report.ts; nothing here loads over the network. */
export const REPORT_TEMPLATE = String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Understanding Map</title>
<style>
${THEME_CSS}* { box-sizing: border-box; }
html { background: var(--bg); }
body { margin: 0; background: var(--bg); color: var(--text); font: 15px/1.5 var(--font); }
main { max-width: 1100px; margin: 0 auto; padding: 16px; }
h1 { font-size: 1.4rem; margin: 0 0 4px; }
h2 { font-size: 1.05rem; margin: 28px 0 10px; }
.meta, .note { color: var(--muted); font-size: 0.88rem; margin: 2px 0; }
.counts { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0 6px; padding: 0; list-style: none; }
.counts li { display: flex; align-items: center; gap: 6px; background: var(--surface); border: 1px solid var(--border); border-radius: 999px; padding: 3px 12px; font-size: 0.88rem; }
.dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.s-owned { background: var(--owned); color: var(--on-owned); }
.s-fragile { background: var(--fragile); color: var(--on-fragile); }
.s-fading { background: var(--fading); color: var(--on-fading); }
.s-dark { background: var(--dark); color: var(--on-dark); }
.s-unknown { background: var(--unknown); color: var(--on-unknown); }
.treemap { position: relative; width: 100%; padding-bottom: 60%; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
.tile { position: absolute; overflow: hidden; border: 1px solid var(--bg); padding: 4px 6px; font-size: 0.78rem; line-height: 1.2; cursor: pointer; word-break: break-all; }
.tile:hover, .tile:focus-visible, .tile.sel { outline: 3px solid var(--accent); outline-offset: -3px; z-index: 1; }
.table-wrap { overflow-x: auto; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; }
table { border-collapse: collapse; width: 100%; min-width: 520px; font-size: 0.88rem; }
th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--border); vertical-align: top; }
th { color: var(--muted); font-weight: 600; white-space: nowrap; }
tbody tr { cursor: pointer; }
tbody tr:hover, tbody tr.sel { background: color-mix(in srgb, var(--accent) 12%, transparent); }
.badge { display: inline-block; border-radius: 4px; padding: 1px 8px; font-size: 0.8rem; }
.zid { font-family: var(--mono); word-break: break-all; }
#panel { margin-top: 16px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 14px 16px; }
#panel h3 { margin: 0 0 6px; font-size: 1.05rem; font-family: var(--mono); word-break: break-all; }
#panel h4 { margin: 14px 0 4px; font-size: 0.9rem; color: var(--muted); }
#panel ul { margin: 0; padding-left: 20px; }
.cmd { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-top: 14px; }
.cmd a { color: var(--accent); font-weight: 600; }
.cmd code { font-family: var(--mono); background: var(--bg); border: 1px solid var(--border); border-radius: 6px; padding: 4px 8px; word-break: break-all; }
.method { padding-left: 20px; color: var(--muted); font-size: 0.88rem; }
.method li { margin: 4px 0; }
.method strong { color: var(--text); }
button { font: inherit; background: var(--accent); color: var(--bg); border: 0; border-radius: 6px; padding: 4px 12px; cursor: pointer; }
</style>
</head>
<body>
<main>
<header>
<h1>Understanding Map</h1>
__HEADER__
</header>
<h2>Map</h2>
<p class="note">Tile area is lines of code; colour is the understanding state. Click a tile for its evidence.</p>
<div class="treemap" id="treemap">__TREEMAP__</div>
<h2>Ranked zones</h2>
<div class="table-wrap">
<table>
<thead><tr><th>Zone</th><th>State</th><th>Lines</th><th>Why it matters</th></tr></thead>
<tbody>__TABLE__</tbody>
</table>
</div>
<section id="panel" aria-live="polite"><p class="note">Select a zone to see its evidence.</p></section>
<section>
<h2>How estimates work</h2>
__METHOD__
</section>
</main>
<script type="application/json" id="data">__DATA__</script>
<script>
(function () {
  var data = JSON.parse(document.getElementById('data').textContent);
  var panel = document.getElementById('panel');
  var byId = {};
  data.zones.forEach(function (z) { byId[z.id] = z; });
  function el(tag, text, cls) {
    var e = document.createElement(tag);
    if (text !== undefined) e.textContent = text;
    if (cls) e.className = cls;
    return e;
  }
  function list(items) {
    var ul = el('ul');
    items.forEach(function (t) { ul.appendChild(el('li', t)); });
    return ul;
  }
  function show(id) {
    var z = byId[id];
    if (!z) return;
    document.querySelectorAll('.sel').forEach(function (n) { n.classList.remove('sel'); });
    document.querySelectorAll('[data-id]').forEach(function (n) { if (n.getAttribute('data-id') === id) n.classList.add('sel'); });
    panel.textContent = '';
    panel.appendChild(el('h3', z.id));
    var st = el('span', z.state, 'badge s-' + z.state);
    panel.appendChild(st);
    panel.appendChild(el('p', z.reason));
    panel.appendChild(el('h4', 'Evidence (an estimate)'));
    var ev = [];
    z.people.forEach(function (p) {
      p.evidence.forEach(function (e) { ev.push((data.mode === 'team' ? p.handle + ': ' : '') + e.text); });
    });
    panel.appendChild(ev.length ? list(ev) : el('p', 'No evidence yet.', 'note'));
    if (data.mode === 'team') {
      panel.appendChild(el('h4', 'Understood by'));
      panel.appendChild(z.understoodBy.length ? list(z.understoodBy) : el('p', 'Nobody active reaches ' + data.threshold + '.', 'note'));
      if (z.leftInactive.length) {
        panel.appendChild(el('h4', 'Left / inactive (not counted)'));
        panel.appendChild(list(z.leftInactive));
      }
    }
    if (z.flags.length) {
      panel.appendChild(el('h4', 'Flags'));
      panel.appendChild(list(z.flags));
    }
    if (z.agentShare > 0) panel.appendChild(el('p', 'About ' + Math.max(1, Math.round(z.agentShare * 100)) + '% of this zone was written by agents.', 'note'));
    panel.appendChild(cmdRow('/understanding-map:learn ' + z.id));
    var vis = cmdRow('/understanding-map:visualize ' + z.id);
    if (z.visual) {
      var a = el('a', 'Open animation');
      a.href = z.visual;
      vis.appendChild(a);
    }
    panel.appendChild(vis);
  }
  function cmdRow(cmd) {
    var row = el('div', undefined, 'cmd');
    row.appendChild(el('code', cmd));
    var btn = el('button', 'Copy');
    btn.type = 'button';
    btn.addEventListener('click', function () {
      try { navigator.clipboard.writeText(cmd).then(function () { btn.textContent = 'Copied'; }, function () { btn.textContent = 'Copy failed'; }); }
      catch (e) { btn.textContent = 'Copy failed'; }
    });
    row.appendChild(btn);
    return row;
  }
  document.querySelectorAll('[data-id]').forEach(function (n) {
    n.addEventListener('click', function () { show(n.getAttribute('data-id')); });
    n.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); show(n.getAttribute('data-id')); } });
  });
})();
</script>
</body>
</html>
`;
