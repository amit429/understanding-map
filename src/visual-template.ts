import { THEME_CSS } from './report-template.js';

/**
 * The hand-written player: drives scene timing, element reveals, the camera (SVG viewBox) and the travelling dot.
 * With prefers-reduced-motion it shows each scene's final frame and only steps manually. No external code.
 */
export const PLAYER_JS = String.raw`(function () {
  var doc = document;
  doc.documentElement.classList.remove('no-js');
  var data = JSON.parse(doc.getElementById('umap-data').textContent);
  var scenes = data.scenes, n = scenes.length, Z = data.zoom, journey = !!data.dot;
  var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var idx = 0, t = 0, playing = !reduce, speed = 1, last = null, hold = 0;
  var $ = function (id) { return doc.getElementById(id); };
  var label = $('scene'), playBtn = $('play'), speedBtn = $('speed');
  var caps = [].slice.call(doc.querySelectorAll('.captions > li'));
  var vb = function (s) { return s.split(' ').map(Number); };
  var svgs = [].slice.call(doc.querySelectorAll('svg.v')).map(function (s) {
    var layers = {};
    [].forEach.call(s.querySelectorAll('.layer'), function (l) { layers[l.getAttribute('data-layer')] = l; });
    var els = [].slice.call(s.querySelectorAll('.el')).map(function (e) {
      var lit = e.getAttribute('data-lit');
      return { e: e, layer: e.parentNode.getAttribute('data-layer'), a: +e.getAttribute('data-a'), homeOnly: e.classList.contains('home-only'),
        lit: lit ? lit.split(' ').map(Number) : null, keep: e.hasAttribute('data-keep-lit') };
    });
    return { s: s, layers: layers, els: els, full: vb(s.getAttribute('data-full')), zoom: vb(s.getAttribute('data-zoom')),
      dot: s.querySelector('.dot'), pts: journey ? data.dot[s.classList.contains('v-w') ? 'w' : 'n'] : null };
  });
  function ease(x) { x = x < 0 ? 0 : x > 1 ? 1 : x; return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
  function mix(a, b, k) { return a.map(function (v, i) { return v + (b[i] - v) * k; }); }
  function dotAt(pts) {
    var h = data.dot.hops, p = pts[0];
    for (var k = 0; k < h.length; k++) {
      if (t >= h[k][1]) p = pts[k + 1];
      else if (t >= h[k][0]) { p = mix(pts[k], pts[k + 1], ease((t - h[k][0]) / (h[k][1] - h[k][0]))); break; }
      else break;
    }
    return p;
  }
  function render() {
    var sc = scenes[idx].id;
    var vis = { why: sc === 'why', journey: sc === 'journey' || sc === 'outro' || (sc === 'inside' && journey && t < Z),
      inside: sc === 'inside' && (!journey || t >= Z), outro: sc === 'outro' };
    svgs.forEach(function (v) {
      for (var k in v.layers) v.layers[k].classList.toggle('show', !!vis[k]);
      v.els.forEach(function (x) {
        var home = x.layer === sc;
        var on = !!vis[x.layer] && (home ? t >= x.a : !x.homeOnly);
        x.e.classList.toggle('on', on);
        if (x.lit) x.e.classList.toggle('lit', on && (home ? t >= x.lit[0] && t < x.lit[1] : x.keep));
      });
      var box = v.full;
      if (journey && sc === 'inside' && t < Z) box = mix(v.full, v.zoom, ease(t / Z));
      if (journey && sc === 'outro' && t < Z) box = mix(v.zoom, v.full, ease(t / Z));
      v.s.setAttribute('viewBox', box.join(' '));
      if (v.dot) {
        var p = dotAt(v.pts);
        v.dot.setAttribute('cx', p[0]);
        v.dot.setAttribute('cy', p[1]);
        v.dot.classList.toggle('on', sc === 'journey' && t >= data.dot.hops[0][0] - 0.4);
      }
    });
    label.textContent = 'Scene ' + (idx + 1) + ' of ' + n + ': ' + scenes[idx].title.replace(/^\d+ · /, '');
    caps.forEach(function (c, i) { c.classList.toggle('current', i === idx); });
  }
  function go(i) { idx = (i + n) % n; t = reduce ? scenes[idx].duration : 0; hold = 0; render(); }
  function setPlaying(p) { playing = p && !reduce; playBtn.textContent = playing ? 'Pause' : 'Play'; playBtn.setAttribute('aria-pressed', String(playing)); }
  function tick(now) {
    if (playing && last !== null) {
      t += Math.min(0.1, (now - last) / 1000) * speed;
      if (t >= scenes[idx].duration) {
        if (idx < n - 1) { idx++; t = 0; }
        else { hold += t - scenes[idx].duration; t = scenes[idx].duration; if (hold > 3) { idx = 0; t = 0; hold = 0; } }
      }
      render();
    }
    last = now;
    requestAnimationFrame(tick);
  }
  $('restart').addEventListener('click', function () { go(0); });
  $('prev').addEventListener('click', function () { go(idx - 1); });
  $('next').addEventListener('click', function () { go(idx + 1); });
  playBtn.addEventListener('click', function () { setPlaying(!playing); });
  speedBtn.addEventListener('click', function () {
    speed = speed === 1 ? 1.5 : 1;
    speedBtn.textContent = speed === 1 ? '1×' : '1.5×';
    speedBtn.setAttribute('aria-label', 'Speed ' + speedBtn.textContent);
  });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') go(idx + 1);
    else if (e.key === 'ArrowLeft') go(idx - 1);
    else if ((e.key === ' ' || e.key === 'k') && !(e.target && e.target.tagName === 'BUTTON')) { e.preventDefault(); setPlaying(!playing); }
  });
  if (reduce) doc.documentElement.classList.add('reduced');
  setPlaying(playing);
  go(0);
  requestAnimationFrame(tick);
})();`;

/** Self-contained visualize page. Placeholders (__NAME__) are filled by visual.ts; nothing loads over the network. */
export const VISUAL_TEMPLATE = String.raw`<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>__TITLE__</title>
<style>
${THEME_CSS}* { box-sizing: border-box; }
html { background: var(--bg); }
body { margin: 0; background: var(--bg); color: var(--text); font: 15px/1.5 var(--font); }
main { max-width: 1320px; margin: 0 auto; padding: 16px; }
h1 { font: 700 1.3rem/1.3 var(--mono); margin: 0 0 4px; word-break: break-all; }
h2 { font-size: 1.05rem; margin: 24px 0 8px; }
.meta, .note { color: var(--muted); font-size: 0.88rem; margin: 2px 0; }
.stage { margin-top: 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
.v { display: block; width: 100%; height: auto; }
.v-n { display: none; max-width: 480px; margin: 0 auto; }
@media (max-width: 760px) {
  main { padding: 12px 0; }
  header, h2, .captions, .note, .controls { padding-left: 12px; padding-right: 12px; }
  .stage { border-radius: 0; border-left: 0; border-right: 0; }
  .v-w { display: none; }
  .v-n { display: block; }
}
.no-js .stage, .no-js .controls { display: none; }
.controls { position: sticky; bottom: 0; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 10px 0; background: var(--bg); }
button { font: inherit; background: var(--accent); color: var(--bg); border: 0; border-radius: 6px; padding: 5px 12px; cursor: pointer; min-width: 44px; min-height: 32px; }
button:focus-visible { outline: 3px solid var(--text); outline-offset: 2px; }
#scene { color: var(--muted); font-size: 0.9rem; }
.reduced #play, .reduced #speed { display: none; }
.captions { padding-left: 20px; }
.captions > li { margin: 6px 0 12px; padding: 4px 8px; border-left: 3px solid transparent; }
.captions > li.current { border-left-color: var(--accent); }
.captions h3 { font-size: 0.95rem; margin: 0 0 2px; }
.captions p { margin: 2px 0; }
.captions ol { margin: 2px 0; padding-left: 20px; }
code { font-family: var(--mono); font-size: 0.88em; background: var(--surface); border: 1px solid var(--border); border-radius: 4px; padding: 0 4px; word-break: break-all; }
/* Stage drawing */
.st-owned { --st: var(--owned); --on-st: var(--on-owned); }
.st-fragile { --st: var(--fragile); --on-st: var(--on-fragile); }
.st-fading { --st: var(--fading); --on-st: var(--on-fading); }
.st-dark { --st: var(--dark); --on-st: var(--on-dark); }
.st-unknown { --st: var(--unknown); --on-st: var(--on-unknown); }
.stage-bg { fill: var(--surface); }
.layer { opacity: 0; transition: opacity .35s ease; }
.layer.show { opacity: 1; }
.el { opacity: 0; transition: opacity .45s ease, transform .45s ease; }
.el.on { opacity: 1; }
.row { transform: translateX(-10px); }
.row.on { transform: none; }
text { fill: var(--text); font-family: var(--font); }
.mono { font-family: var(--mono); }
.b, .strong { font-weight: 700; }
.h { fill: var(--muted); }
.badge-bg { fill: var(--st); }
.badge-t { fill: var(--on-st); }
.box-bg { fill: var(--bg); stroke: var(--border); stroke-width: 1.5; }
.box-t { fill: var(--text); }
.box.tgt .box-bg { fill: var(--st); stroke: var(--st); }
.box.tgt .box-t { fill: var(--on-st); }
.box.tgt.lit .box-bg { stroke: var(--accent); stroke-width: 3; filter: drop-shadow(0 0 10px var(--accent)); }
.pill-bg { fill: color-mix(in srgb, var(--accent) 12%, var(--surface)); stroke: var(--accent); stroke-width: 1.5; }
.arrow { stroke: var(--muted); stroke-width: 2; }
.ah { fill: var(--muted); }
.link { stroke: var(--accent); stroke-width: 1.5; stroke-dasharray: 4 4; }
.dot { fill: var(--accent); stroke: var(--surface); stroke-width: 2; opacity: 0; transition: opacity .3s; }
.dot.on { opacity: 1; }
.chip-bg { fill: var(--bg); stroke: var(--border); }
.chip-t { fill: var(--muted); }
.inside-bg { fill: color-mix(in srgb, var(--st) 9%, var(--surface)); }
.row-bg { fill: var(--surface); stroke: var(--border); }
.row.lit .row-bg { fill: color-mix(in srgb, var(--accent) 10%, var(--surface)); stroke: var(--accent); stroke-width: 2; }
.num-bg { fill: var(--border); }
.row.lit .num-bg { fill: var(--accent); }
.row.lit .num-t { fill: var(--surface); }
.gotcha-bg { fill: color-mix(in srgb, var(--fragile) 14%, var(--surface)); stroke: var(--fragile); stroke-width: 2; }
.closing { fill: var(--accent); }
@media (prefers-reduced-motion: reduce) {
  .layer, .el, .dot { transition: none !important; }
  .row { transform: none; }
}
</style>
</head>
<body>
<main>
<header>
<h1>__ZONE__</h1>
<p class="meta">__META__</p>
</header>
<div class="stage" id="stage">__STAGE__</div>
<div class="controls" role="toolbar" aria-label="Animation controls">
<button type="button" id="restart">Restart</button>
<button type="button" id="prev" aria-label="Previous scene">Prev</button>
<button type="button" id="play" aria-pressed="true">Pause</button>
<button type="button" id="next" aria-label="Next scene">Next</button>
<button type="button" id="speed" aria-label="Speed 1×">1×</button>
<span id="scene" aria-live="polite"></span>
</div>
<h2>Scenes</h2>
__CAPTIONS__
<p class="note">Watching doesn't change the Understanding Map. To lock it in, run <code>__LEARN__</code>.</p>
</main>
<script type="application/json" id="umap-data">__DATA__</script>
<script>
${PLAYER_JS}
</script>
</body>
</html>
`;
