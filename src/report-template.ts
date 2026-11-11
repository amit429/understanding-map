/** Self-contained report shell. Placeholders (__NAME__) are filled by report.ts; nothing here loads over the network. */
export const REPORT_TEMPLATE = String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Understanding Map</title>
<style>
:root {
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
* { box-sizing: border-box; }
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
.cmd code { font-family: var(--mono); background: var(--bg); border: 1px solid var(--border); border-radius: 6px; padding: 4px 8px; word-break: break-all; }
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
    var cmd = '/understanding-map:learn ' + z.id;
    var row = el('div', undefined, 'cmd');
    row.appendChild(el('code', cmd));
    var btn = el('button', 'Copy');
    btn.type = 'button';
    btn.addEventListener('click', function () {
      try { navigator.clipboard.writeText(cmd).then(function () { btn.textContent = 'Copied'; }, function () { btn.textContent = 'Copy failed'; }); }
      catch (e) { btn.textContent = 'Copy failed'; }
    });
    row.appendChild(btn);
    panel.appendChild(row);
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
