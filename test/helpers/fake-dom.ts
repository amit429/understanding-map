/**
 * A tiny DOM, just enough to run the visualize player (PLAYER_JS) in a test without a browser or new dependencies.
 * It parses the page's own well-formed HTML and supports the selectors the player uses: `tag.class`, `.class` and
 * `a > b`.
 */
type Listener = (ev: FakeEvent) => void;
export interface FakeEvent { type: string; key?: string; target?: FakeEl | null; preventDefault: () => void }

const VOID = new Set(['meta', 'link', 'br', 'img', 'input', 'hr']);
const RAW = new Set(['script', 'style']);
const decode = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

export class FakeEl {
  attrs = new Map<string, string>();
  children: FakeEl[] = [];
  parentNode: FakeEl | null = null;
  text = '';
  listeners: Record<string, Listener[]> = {};
  /** Every class change, in order, as "add:x" / "remove:x". */
  classLog: string[] = [];
  textWrites = 0;
  style: Record<string, string> = {};
  constructor(public tag: string) {}

  get tagName() { return this.tag.toUpperCase(); }
  get id() { return this.attrs.get('id') ?? ''; }
  getAttribute(n: string) { return this.attrs.has(n) ? this.attrs.get(n)! : null; }
  setAttribute(n: string, v: unknown) { this.attrs.set(n, String(v)); }
  hasAttribute(n: string) { return this.attrs.has(n); }
  private get classes() { return (this.attrs.get('class') ?? '').split(/\s+/).filter(Boolean); }
  private setClasses(c: string[]) { this.attrs.set('class', c.join(' ')); }
  get classList() {
    const el = this;
    return {
      contains: (c: string) => el.classes.includes(c),
      add: (c: string) => { if (!el.classes.includes(c)) { el.setClasses([...el.classes, c]); el.classLog.push(`add:${c}`); } },
      remove: (c: string) => { if (el.classes.includes(c)) { el.setClasses(el.classes.filter((x) => x !== c)); el.classLog.push(`remove:${c}`); } },
      toggle: (c: string, force?: boolean) => {
        const on = force === undefined ? !el.classes.includes(c) : force;
        if (on) el.classList.add(c); else el.classList.remove(c);
        return on;
      },
    };
  }
  get textContent(): string { return this.text + this.children.map((c) => c.textContent).join(''); }
  set textContent(v: string) { this.text = String(v); this.children = []; this.textWrites++; }
  addEventListener(type: string, fn: Listener) { (this.listeners[type] ??= []).push(fn); }
  dispatch(ev: Omit<FakeEvent, 'preventDefault'>) {
    for (const fn of this.listeners[ev.type] ?? []) fn({ ...ev, preventDefault: () => {} });
  }
  click() { this.dispatch({ type: 'click', target: this }); }
  descendants(): FakeEl[] { return this.children.flatMap((c) => [c, ...c.descendants()]); }
  querySelectorAll(sel: string): FakeEl[] { return this.descendants().filter((e) => matches(e, sel)); }
  querySelector(sel: string): FakeEl | null { return this.querySelectorAll(sel)[0] ?? null; }
}

function matchesCompound(e: FakeEl, part: string): boolean {
  const m = /^([a-z][\w-]*)?((?:\.[\w-]+)*)$/i.exec(part.trim());
  if (!m) throw new Error(`fake-dom: unsupported selector "${part}"`);
  if (m[1] && e.tag !== m[1].toLowerCase()) return false;
  return m[2].split('.').filter(Boolean).every((c) => e.classList.contains(c));
}

function matches(e: FakeEl, sel: string): boolean {
  const parts = sel.split('>').map((p) => p.trim());
  let cur: FakeEl | null = e;
  for (let i = parts.length - 1; i >= 0; i--) {
    if (!cur || !matchesCompound(cur, parts[i])) return false;
    cur = cur.parentNode;
  }
  return true;
}

export function parseHtml(html: string): FakeEl {
  const root = new FakeEl('#document');
  const stack: FakeEl[] = [root];
  let i = 0;
  while (i < html.length) {
    if (html.startsWith('<!--', i)) { i = html.indexOf('-->', i) + 3; continue; }
    if (html[i] === '<' && html[i + 1] === '!') { i = html.indexOf('>', i) + 1; continue; }
    if (html[i] === '<' && html[i + 1] === '/') {
      const j = html.indexOf('>', i);
      const name = html.slice(i + 2, j).trim().toLowerCase();
      while (stack.length > 1 && stack[stack.length - 1].tag !== name) stack.pop();
      if (stack.length > 1) stack.pop();
      i = j + 1;
      continue;
    }
    if (html[i] === '<') {
      const j = html.indexOf('>', i);
      let raw = html.slice(i + 1, j);
      const selfClosing = raw.endsWith('/');
      if (selfClosing) raw = raw.slice(0, -1);
      const name = /^[a-zA-Z][\w-]*/.exec(raw)![0].toLowerCase();
      const el = new FakeEl(name);
      for (const a of raw.slice(name.length).matchAll(/([\w:-]+)(?:="([^"]*)")?/g)) el.attrs.set(a[1], decode(a[2] ?? ''));
      el.parentNode = stack[stack.length - 1];
      stack[stack.length - 1].children.push(el);
      i = j + 1;
      if (RAW.has(name)) {
        const end = html.indexOf(`</${name}`, i);
        el.text = html.slice(i, end);
        i = html.indexOf('>', end) + 1;
      } else if (!selfClosing && !VOID.has(name)) stack.push(el);
      continue;
    }
    const next = html.indexOf('<', i);
    const end = next < 0 ? html.length : next;
    stack[stack.length - 1].text += decode(html.slice(i, end));
    i = end;
  }
  return root;
}

export interface FakePage {
  doc: FakeEl & { documentElement: FakeEl; hidden: boolean; getElementById: (id: string) => FakeEl | null };
  byId: (id: string) => FakeEl;
  /** Runs queued animation frames, advancing the clock by `ms` per frame. */
  frames: (count: number, ms?: number) => void;
  key: (key: string) => void;
  setHidden: (hidden: boolean) => void;
}

/** Parses a rendered visualize page and runs its player against the fake DOM. Nothing runs until `frames` is called. */
export function runPlayer(html: string, playerJs: string, opts: { reduce?: boolean; hidden?: boolean } = {}): FakePage {
  const root = parseHtml(html);
  const htmlEl = root.querySelector('html')!;
  const doc = Object.assign(root, {
    documentElement: htmlEl,
    hidden: !!opts.hidden,
    getElementById: (id: string) => root.descendants().find((e) => e.id === id) ?? null,
  });
  let queue: Array<(now: number) => void> = [];
  let now = 0;
  const raf = (cb: (now: number) => void) => { queue.push(cb); return queue.length; };
  const matchMedia = (q: string) => ({ matches: !!opts.reduce && q.includes('reduce') });
  const getComputedStyle = (e: FakeEl) => ({ opacity: e.classList.contains('show') ? '1' : '0' });
  const win = { matchMedia };
  new Function('document', 'window', 'matchMedia', 'requestAnimationFrame', 'getComputedStyle', playerJs)(doc, win, matchMedia, raf, getComputedStyle);
  return {
    doc,
    byId: (id) => doc.getElementById(id)!,
    frames: (count, ms = 100) => {
      for (let k = 0; k < count; k++) {
        const q = queue;
        queue = [];
        now += ms;
        for (const cb of q) cb(now);
      }
    },
    key: (key) => doc.dispatch({ type: 'keydown', key, target: htmlEl }),
    setHidden: (h) => { doc.hidden = h; doc.dispatch({ type: 'visibilitychange' }); },
  };
}
