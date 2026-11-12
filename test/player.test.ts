import { describe, expect, it } from 'vitest';
import type { Storyboard } from '../src/storyboard';
import { renderVisual, type LiveZone } from '../src/visual';
import { PLAYER_JS } from '../src/visual-template';
import { runPlayer, type FakeEl, type FakePage } from './helpers/fake-dom';

const story = (journey = true): Storyboard => ({
  zone: 'src/payments',
  trigger: journey ? { label: 'User clicks Pay', ref: 'web/a.ts:1' } : null,
  journey: journey ? [
    { label: 'checkout page', zone: 'web', ref: 'web/a.ts:1', target: false },
    { label: 'payments', zone: 'src/payments', ref: 'src/payments/a.ts:1', target: true, role: 'charges the card' },
  ] : null,
  outcome: journey ? { label: 'Receipt sent' } : null,
  steps: [
    { label: 'build the charge', ref: 'src/payments/a.ts:1' },
    { label: 'send to Stripe', ref: 'src/payments/a.ts:2' },
    { label: 'record the result', ref: 'src/payments/a.ts:3' },
  ],
  gotcha: { label: 'Zero refunds skip the ledger', ref: 'src/payments/a.ts:4' },
});
const live: LiveZone = { id: 'src/payments', state: 'dark', reason: 'Dark · 3 files import it', fanIn: 3 };
const page = (opts: { journey?: boolean; reduce?: boolean; hidden?: boolean } = {}) =>
  runPlayer(renderVisual(story(opts.journey ?? true), live, 'd').html, PLAYER_JS, opts);

const svgs = (p: FakePage) => p.doc.querySelectorAll('svg.v');
const layer = (svg: FakeEl, id: string) => svg.querySelectorAll('.layer').find((l) => l.getAttribute('data-layer') === id) ?? null;
const shown = (svg: FakeEl) => svg.querySelectorAll('.layer').filter((l) => l.classList.contains('show')).map((l) => l.getAttribute('data-layer'));
const sceneLabel = (p: FakePage) => p.byId('scene').textContent;

/** The scene is fully drawn: its own layer is shown and every element in it is on (except the dot). */
function expectFull(p: FakePage, id: string) {
  for (const svg of svgs(p)) {
    const l = layer(svg, id)!;
    expect(l.classList.contains('show'), `${id} layer shown`).toBe(true);
    for (const e of l.querySelectorAll('.el')) expect(e.classList.contains('on'), `${id}: ${e.getAttribute('class')}`).toBe(true);
  }
}

describe('player', () => {
  it('paused, Next and Prev show the whole target scene at once, without a running clock', () => {
    const p = page();
    p.byId('play').click(); // pause
    expect(p.byId('play').textContent).toBe('Play');
    p.byId('next').click();
    expect(sceneLabel(p)).toBe('Scene 2 of 4: Product journey');
    expectFull(p, 'journey');
    p.byId('next').click();
    expectFull(p, 'inside');
    for (const svg of svgs(p)) expect(shown(svg)).toEqual(['inside']);
    const rows = svgs(p)[0].querySelectorAll('.row');
    expect(rows.map((r) => r.classList.contains('lit'))).toEqual([false, false, true]);
    p.byId('next').click();
    expectFull(p, 'outro');
    for (const svg of svgs(p)) {
      expect(shown(svg).sort()).toEqual(['journey', 'outro']);
      for (const e of layer(svg, 'journey')!.querySelectorAll('.home-only')) expect(e.classList.contains('on')).toBe(false);
    }
    p.byId('prev').click();
    expectFull(p, 'inside');
    p.key('ArrowLeft');
    expectFull(p, 'journey');
  });

  it('sizes the stage to each scene and ends a scene with the camera at rest', () => {
    const p = page();
    p.byId('play').click();
    for (const id of ['journey', 'inside', 'outro']) {
      p.byId('next').click();
      for (const svg of svgs(p)) {
        const [x, y, w, h] = svg.getAttribute('viewBox')!.split(' ').map(Number);
        expect([x, y]).toEqual([0, 0]);
        expect(w).toBe(svg.classList.contains('v-w') ? 1280 : 375);
        expect(h).toBeGreaterThan(100);
      }
      expect(id).toBeTruthy();
    }
  });

  it('zooms into the target box at the start of "inside", and out of it at the start of "back out"', () => {
    const p = page();
    const wide = () => svgs(p).find((s) => s.classList.contains('v-w'))!;
    const vb = () => wide().getAttribute('viewBox')!.split(' ').map(Number);
    p.frames(1);
    p.byId('next').click();
    p.byId('next').click(); // inside, playing from t = 0
    p.frames(1);
    expect(vb()[2]).toBeGreaterThan(1200); // starts wide
    p.frames(10);
    expect(vb()[2]).toBeLessThan(600); // close to the target box
    p.frames(5);
    expect(vb()[2]).toBe(1280); // inside, at rest
    p.byId('next').click(); // back out, t = 0
    p.frames(1);
    expect(vb()[2]).toBeLessThan(600);
    p.frames(15);
    expect(vb()[2]).toBe(1280);
  });

  it('handles three scenes when there is no journey', () => {
    const p = page({ journey: false });
    p.byId('play').click();
    p.byId('next').click();
    expect(sceneLabel(p)).toBe('Scene 2 of 3: Inside the zone');
    expectFull(p, 'inside');
    p.byId('next').click();
    expectFull(p, 'outro');
    for (const svg of svgs(p)) expect(layer(svg, 'journey')).toBeNull();
    p.byId('next').click();
    expect(sceneLabel(p)).toBe('Scene 1 of 3: Why this matters');
  });

  it('with reduced motion shows complete still frames and steps manually', () => {
    const p = page({ reduce: true });
    expect(p.doc.documentElement.classList.contains('reduced')).toBe(true);
    expectFull(p, 'why');
    p.frames(50);
    expect(sceneLabel(p)).toBe('Scene 1 of 4: Why this matters');
    p.key('ArrowRight');
    expectFull(p, 'journey');
    p.byId('play').click();
    expect(p.byId('play').textContent).toBe('Play');
  });

  it('plays from the start of a scene; Play after a paused step restarts that scene', () => {
    const p = page();
    p.frames(1);
    const why = () => layer(svgs(p)[0], 'why')!.querySelectorAll('.el').filter((e) => e.classList.contains('on')).length;
    expect(why()).toBe(1); // only the heading at t = 0
    p.frames(40);
    expect(why()).toBe(4);
    p.byId('play').click();
    p.byId('next').click();
    expectFull(p, 'journey');
    p.byId('play').click();
    p.frames(2);
    const on = layer(svgs(p)[0], 'journey')!.querySelectorAll('.el').filter((e) => e.classList.contains('on')).length;
    expect(on).toBeLessThan(layer(svgs(p)[0], 'journey')!.querySelectorAll('.el').length);
  });

  it('a page opened in a hidden tab waits, fully drawn, and starts playing when shown', () => {
    const p = page({ hidden: true });
    expect(p.byId('play').textContent).toBe('Play');
    expectFull(p, 'why');
    p.setHidden(false);
    expect(p.byId('play').textContent).toBe('Pause');
  });

  it('announces a scene only when it changes', () => {
    const p = page();
    p.frames(1);
    const before = p.byId('scene').textWrites;
    p.frames(30);
    expect(p.byId('scene').textWrites).toBe(before);
    p.byId('next').click();
    expect(p.byId('scene').textWrites).toBe(before + 1);
  });

  it('hides the outgoing layer without a fade when the scene changes, so the camera never shows it mid-zoom', () => {
    const p = page();
    p.byId('play').click();
    p.byId('next').click();
    p.byId('next').click(); // inside
    const inside = layer(svgs(p)[0], 'inside')!;
    inside.classLog = [];
    p.byId('next').click(); // outro
    const log = inside.classLog;
    expect(log.indexOf('add:cut')).toBeGreaterThanOrEqual(0);
    expect(log.indexOf('add:cut')).toBeLessThan(log.indexOf('remove:show'));
    expect(inside.classList.contains('cut')).toBe(false);
  });
});
