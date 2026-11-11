import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  addFlag, appendAttempt, appendLocalPartial, appendPass, readFlags, readLocalPartials, readPasses,
} from '../src/events';
import { gitIn, makeRepo } from './helpers/repo';

const ev = (zone: string, date: string, level = 3) => ({ zone, level, fingerprint: { 'a.ts': 'h1' }, date, kind: 'session' as const });
const evLine = (e: ReturnType<typeof ev>) => JSON.stringify(e) + '\n';

describe('pass events', () => {
  it('round-trips appendPass / readPasses', () => {
    const root = makeRepo([{ files: { 'x': '1' } }]);
    appendPass(root, 'amit', ev('src', '2026-01-01'));
    appendPass(root, 'amit', ev('src', '2026-02-01'));
    appendPass(root, 'bo', ev('lib', '2026-01-05'));
    const m = readPasses(root, null);
    expect(m.get('amit')).toEqual([ev('src', '2026-01-01'), ev('src', '2026-02-01')]);
    expect(m.get('bo')).toEqual([ev('lib', '2026-01-05')]);
  });

  it('returns events present only at the ref', () => {
    const e = ev('src', '2026-01-01');
    const root = makeRepo([{ files: { '.understanding/events/amit.jsonl': evLine(e) } }]);
    gitIn(root, ['update-ref', 'refs/remotes/origin/main', 'HEAD']);
    gitIn(root, ['rm', '-q', '--cached', '.understanding/events/amit.jsonl']);
    gitIn(root, ['commit', '-q', '-m', 'untrack']);
    gitIn(root, ['clean', '-fdq']);
    expect(existsSync(join(root, '.understanding/events/amit.jsonl'))).toBe(false);
    expect(readPasses(root, 'origin/main').get('amit')).toEqual([e]);
  });

  it('dedupes events present in both working tree and ref, but keeps a line written twice', () => {
    const a = ev('src', '2026-01-01');
    const b = ev('src', '2026-02-01');
    const root = makeRepo([{ files: { '.understanding/events/amit.jsonl': evLine(a) } }]);
    gitIn(root, ['update-ref', 'refs/remotes/origin/main', 'HEAD']);
    appendPass(root, 'amit', b);
    expect(readPasses(root, 'origin/main').get('amit')).toEqual([a, b]);
    appendPass(root, 'amit', a); // same line twice in the working tree
    expect(readPasses(root, 'origin/main').get('amit')).toEqual([a, a, b]);
  });

  it('skips unparseable lines', () => {
    const root = makeRepo([{ files: { x: '1' } }]);
    mkdirSync(join(root, '.understanding/events'), { recursive: true });
    writeFileSync(join(root, '.understanding/events/amit.jsonl'), `not json\n${evLine(ev('src', '2026-01-01'))}\n`);
    expect(readPasses(root, null).get('amit')).toEqual([ev('src', '2026-01-01')]);
  });

  it('keeps both events when two branches append and merge via merge=union', () => {
    const root = makeRepo([{ files: { '.gitattributes': '.understanding/events/*.jsonl merge=union\n', '.understanding/events/amit.jsonl': evLine(ev('base', '2026-01-01')) } }]);
    const a = ev('src', '2026-02-01');
    const b = ev('lib', '2026-03-01');
    gitIn(root, ['checkout', '-q', '-b', 'one']);
    appendPass(root, 'amit', a);
    gitIn(root, ['commit', '-qam', 'one']);
    gitIn(root, ['checkout', '-q', 'main']);
    gitIn(root, ['checkout', '-q', '-b', 'two']);
    appendPass(root, 'amit', b);
    gitIn(root, ['commit', '-qam', 'two']);
    gitIn(root, ['merge', '--no-edit', 'one']);
    const got = readPasses(root, null).get('amit')!;
    expect(got).toHaveLength(3);
    expect(got).toEqual(expect.arrayContaining([ev('base', '2026-01-01'), a, b]));
  });
});

describe('local store and privacy', () => {
  it('appendAttempt and appendLocalPartial write only under local/', () => {
    const root = makeRepo([{ files: { x: '1' } }]);
    appendLocalPartial(root, ev('src', '2026-01-01', 1));
    appendAttempt(root, { zone: 'src', kind: 'session', result: 'miss', date: '2026-01-01', retryAfter: '2026-01-02' });
    expect(existsSync(join(root, '.understanding/events'))).toBe(false);
    expect(readdirSync(join(root, '.understanding')).sort()).toEqual(['local']);
    expect(readdirSync(join(root, '.understanding/local')).sort()).toEqual(['attempts.jsonl', 'partials.jsonl']);
    expect(readLocalPartials(root)).toEqual([ev('src', '2026-01-01', 1)]);
  });

  it('readLocalPartials is empty when none exist', () => {
    expect(readLocalPartials(makeRepo([{ files: { x: '1' } }]))).toEqual([]);
  });

  it('addFlag is idempotent', () => {
    const root = makeRepo([{ files: { x: '1' } }]);
    expect(readFlags(root)).toEqual({});
    addFlag(root, 'src', 'hard-to-verify');
    addFlag(root, 'src', 'hard-to-verify');
    addFlag(root, 'src', 'unreviewed-agent-code');
    addFlag(root, 'lib', 'hard-to-verify');
    expect(readFlags(root)).toEqual({ src: ['hard-to-verify', 'unreviewed-agent-code'], lib: ['hard-to-verify'] });
  });
});
