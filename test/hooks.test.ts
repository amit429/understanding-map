import { mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { main } from '../src/cli';
import { appendEdit, readEdits } from '../src/editlog';
import { onPostToolUse, onStop } from '../src/hooks';
import { runSetup } from '../src/setup';
import { umDir } from '../src/config';
import { makeRepo } from './helpers/repo';

afterEach(() => { vi.restoreAllMocks(); });

function setUpRepo(): string {
  const root = realpathSync(makeRepo([{ files: { 'src/a.ts': 'a\n', 'lib/b.ts': 'b\n' } }]));
  runSetup(root, { mode: 'solo', critical: [] });
  return root;
}
const edit = (root: string, file: string, newStart: number, newLines: number) => ({
  session_id: 's1', cwd: root, tool_name: 'Edit',
  tool_input: { file_path: join(root, file) },
  tool_response: { structuredPatch: [{ newStart, newLines }] },
});
const seed = (root: string, file: string, lines: number, ts: string) =>
  appendEdit(root, { file, ranges: [[1, lines]], lines, session: 's', ts });

describe('onPostToolUse', () => {
  it('appends the edit with ranges from the structured patch', () => {
    const root = setUpRepo();
    onPostToolUse(edit(root, 'src/a.ts', 10, 4));
    const [e] = readEdits(root);
    expect(e).toMatchObject({ file: 'src/a.ts', ranges: [[10, 13]], lines: 4, session: 's1' });
    expect(() => new Date(e.ts).toISOString()).not.toThrow();
  });

  it('counts the content lines of a Write with no patch', () => {
    const root = setUpRepo();
    onPostToolUse({ session_id: 's', cwd: root, tool_name: 'Write', tool_input: { file_path: join(root, 'src/new.ts'), content: 'a\nb\nc\n' }, tool_response: {} });
    expect(readEdits(root)[0]).toMatchObject({ file: 'src/new.ts', ranges: [[1, 3]], lines: 3 });
  });

  it('counts new_string lines for Edit and MultiEdit without a patch', () => {
    const root = setUpRepo();
    onPostToolUse({ session_id: 's', cwd: root, tool_name: 'Edit', tool_input: { file_path: join(root, 'src/a.ts'), new_string: 'x\ny' } });
    onPostToolUse({ session_id: 's', cwd: root, tool_name: 'MultiEdit', tool_input: { file_path: join(root, 'src/a.ts'), edits: [{ new_string: 'x' }, { new_string: 'y\nz' }] } });
    expect(readEdits(root).map((e) => e.lines)).toEqual([2, 3]);
  });

  it('reads notebook_path for NotebookEdit', () => {
    const root = setUpRepo();
    onPostToolUse({ session_id: 's', cwd: root, tool_name: 'NotebookEdit', tool_input: { notebook_path: join(root, 'n.ipynb'), new_source: 'a\nb' } });
    expect(readEdits(root)[0]?.file).toBe('n.ipynb');
  });

  it('ignores files outside the repo, repos not set up, and malformed input', () => {
    const root = setUpRepo();
    const other = realpathSync(makeRepo([{ files: { 'x.ts': 'x\n' } }]));
    expect(() => {
      onPostToolUse({ session_id: 's', cwd: root, tool_name: 'Edit', tool_input: { file_path: join(other, 'x.ts') }, tool_response: { structuredPatch: [{ newStart: 1, newLines: 1 }] } });
      onPostToolUse(edit(other, 'x.ts', 1, 1));
      onPostToolUse(null);
      onPostToolUse('x');
      onPostToolUse({ session_id: 's', cwd: root, tool_name: 'Edit' });
      onPostToolUse({ cwd: root, tool_input: { file_path: 5 } });
    }).not.toThrow();
    expect(readEdits(root)).toEqual([]);
    expect(readEdits(other)).toEqual([]);
  });

  it('stays under 50 ms on a 10,000-line log (append only)', () => {
    const root = setUpRepo();
    mkdirSync(join(umDir(root), 'local'), { recursive: true });
    const line = JSON.stringify({ file: 'src/a.ts', ranges: [[1, 2]], lines: 2, session: 's', ts: '2025-01-01T00:00:00.000Z' }) + '\n';
    writeFileSync(join(umDir(root), 'local', 'edits.jsonl'), line.repeat(10000));
    onPostToolUse(edit(root, 'src/a.ts', 1, 1)); // warm up
    const t = performance.now();
    onPostToolUse(edit(root, 'src/a.ts', 1, 1));
    expect(performance.now() - t).toBeLessThan(50);
  });
});

describe('onPostToolUse hunks with context', () => {
  const patchInput = (root: string, hunk: object) => ({
    session_id: 's', cwd: root, tool_name: 'Edit', tool_input: { file_path: join(root, 'src/a.ts') },
    tool_response: { structuredPatch: [hunk] },
  });

  it('counts only added lines of a hunk with context', () => {
    const root = setUpRepo();
    onPostToolUse(patchInput(root, { newStart: 10, newLines: 7, lines: [' a', ' b', ' c', '-x', '+y', ' d', ' e', ' f'] }));
    expect(readEdits(root)[0]).toMatchObject({ lines: 1, ranges: [[13, 13]] });
  });

  it('yields one range per separate added run', () => {
    const root = setUpRepo();
    onPostToolUse(patchInput(root, { newStart: 5, newLines: 8, lines: [' a', '+b', '+c', ' d', '-e', '+f', ' g'] }));
    expect(readEdits(root)[0]).toMatchObject({ lines: 3, ranges: [[6, 7], [9, 9]] });
  });

  it('falls back to newStart/newLines when the hunk has no lines array', () => {
    const root = setUpRepo();
    onPostToolUse(patchInput(root, { newStart: 3, newLines: 2 }));
    expect(readEdits(root)[0]).toMatchObject({ lines: 2, ranges: [[3, 4]] });
  });
});

describe('onStop', () => {
  it('nudges at the threshold, not again without new edits, and again after 50 more', () => {
    const root = setUpRepo();
    const input = { session_id: 's', cwd: root, hook_event_name: 'Stop' };
    seed(root, 'src/a.ts', 30, '2025-01-01T00:00:01.000Z');
    expect(onStop(input)).toBeNull();
    seed(root, 'lib/b.ts', 30, '2025-01-01T00:00:02.000Z');
    const msg = onStop(input);
    expect(msg).not.toBeNull();
    expect(msg).toContain('~60 lines');
    expect(msg).toContain('/understanding-map:handoff');
    expect(msg).toContain('2 zones');
    expect(JSON.parse(msg!)).toEqual({ systemMessage: expect.any(String) });
    expect(msg).not.toContain('decision');
    expect(onStop(input)).toBeNull();
    seed(root, 'src/a.ts', 50, '2025-01-01T00:00:03.000Z');
    const again = onStop(input);
    expect(again).toContain('~110 lines');
    expect(again).not.toContain('decision');
  });

  it('is silent when handoff is disabled or the repo is not set up', () => {
    const root = setUpRepo();
    writeFileSync(join(umDir(root), 'config.json'), JSON.stringify({ mode: 'solo', handoff: { enabled: false, minLines: 50 } }));
    seed(root, 'src/a.ts', 200, '2025-01-01T00:00:01.000Z');
    expect(onStop({ cwd: root })).toBeNull();
    const bare = realpathSync(makeRepo([{ files: { 'a.ts': 'a\n' } }]));
    expect(onStop({ cwd: bare })).toBeNull();
    expect(onStop(null)).toBeNull();
    expect(onStop('x')).toBeNull();
  });
});

describe('hook CLI', () => {
  it('always exits 0 and prints only the stop JSON', async () => {
    const root = setUpRepo();
    seed(root, 'src/a.ts', 80, '2025-01-01T00:00:01.000Z');
    let stdout = '';
    vi.spyOn(process.stdout, 'write').mockImplementation((s) => { stdout += String(s); return true; });
    const withStdin = async (text: string, argv: string[]) => {
      Object.defineProperty(process, 'stdin', { value: Readable.from([text]), configurable: true });
      return main(argv);
    };
    expect(await withStdin('not json', ['hook', 'stop'])).toBe(0);
    expect(stdout).toBe('');
    expect(await withStdin(JSON.stringify({ cwd: root }), ['hook', 'stop'])).toBe(0);
    expect(JSON.parse(stdout).systemMessage).toContain('~80 lines');
    expect(stdout.trim().split('\n')).toHaveLength(1);
    expect(await withStdin('', ['hook', 'post-tool-use'])).toBe(0);
    expect(await withStdin('{}', ['hook', 'bogus'])).toBe(0);
  });
});
