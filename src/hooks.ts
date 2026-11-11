import { realpathSync } from 'node:fs';
import { dirname, basename, isAbsolute, join, relative, resolve } from 'node:path';
import { isSetUp, loadConfig } from './config.js';
import { appendEdit, getNudgedLines, setNudgedLines, uncheckedEdits } from './editlog.js';
import { repoRootOf } from './git.js';
import { readZoneCache } from './zones.js';

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Number of lines in a piece of text (a trailing newline does not add a line). */
function lineCount(s: unknown): number {
  if (typeof s !== 'string' || s === '') return 0;
  const n = s.split('\n').length;
  return s.endsWith('\n') ? n - 1 : n;
}

/** Repo-relative POSIX path, or null when the file is outside the repo. */
function repoRelative(root: string, file: string, cwd: string): string | null {
  const abs = isAbsolute(file) ? file : resolve(cwd, file);
  const attempt = (p: string): string | null => {
    const rel = relative(root, p);
    return rel === '' || rel.startsWith('..') || isAbsolute(rel) ? null : rel.split('\\').join('/');
  };
  const direct = attempt(abs);
  if (direct) return direct;
  try {
    // symlinked prefixes (e.g. /var vs /private/var): resolve the parent, which exists even for new files
    return attempt(join(realpathSync(dirname(abs)), basename(abs)));
  } catch {
    return null;
  }
}

function rangesOf(response: unknown, input: Record<string, unknown>, tool: unknown): { ranges: Array<[number, number]>; lines: number } {
  const patch = isObj(response) && Array.isArray(response.structuredPatch) ? response.structuredPatch : null;
  if (patch && patch.length > 0) {
    const ranges: Array<[number, number]> = [];
    let lines = 0;
    for (const h of patch) {
      if (!isObj(h) || typeof h.newStart !== 'number') continue;
      if (Array.isArray(h.lines)) {
        // hunks carry context lines: count only '+' entries, as runs of new-file line numbers
        let n = h.newStart;
        let runStart = -1;
        const close = () => {
          if (runStart >= 0) ranges.push([runStart, n - 1]);
          runStart = -1;
        };
        for (const l of h.lines) {
          const c = typeof l === 'string' ? l[0] : '';
          if (c === '+') {
            if (runStart < 0) runStart = n;
            n++;
            lines++;
          } else if (c === '-') {
            close();
          } else {
            close();
            n++;
          }
        }
        close();
      } else if (typeof h.newLines === 'number' && h.newLines > 0) {
        ranges.push([h.newStart, h.newStart + h.newLines - 1]);
        lines += h.newLines;
      }
    }
    if (ranges.length > 0) return { ranges, lines };
  }
  let lines = 0;
  if (tool === 'Write') lines = lineCount(input.content);
  else if (tool === 'MultiEdit' && Array.isArray(input.edits)) {
    for (const e of input.edits) if (isObj(e)) lines += lineCount(e.new_string);
  } else if (tool === 'NotebookEdit') lines = lineCount(input.new_source);
  else lines = lineCount(input.new_string);
  return { ranges: lines > 0 ? [[1, lines]] : [], lines };
}

/** Appends one edit-log entry for the edited file. Never throws, never reads the log. */
export function onPostToolUse(input: unknown): void {
  try {
    if (!isObj(input) || !isObj(input.tool_input)) return;
    const ti = input.tool_input;
    const file = typeof ti.file_path === 'string' ? ti.file_path : typeof ti.notebook_path === 'string' ? ti.notebook_path : null;
    if (!file) return;
    const cwd = typeof input.cwd === 'string' ? input.cwd : process.cwd();
    const root = repoRootOf(cwd);
    if (!root || !isSetUp(root)) return;
    const rel = repoRelative(root, file, cwd);
    if (!rel) return;
    const { ranges, lines } = rangesOf(input.tool_response, ti, input.tool_name);
    appendEdit(root, {
      file: rel, ranges, lines,
      session: typeof input.session_id === 'string' ? input.session_id : '',
      ts: new Date().toISOString(),
    });
  } catch { /* hooks never throw */ }
}

/** Returns the one-line handoff nudge as JSON text, or null. Never blocks, never throws. */
export function onStop(input: unknown): string | null {
  try {
    if (!isObj(input)) return null;
    const cwd = typeof input.cwd === 'string' ? input.cwd : process.cwd();
    const root = repoRootOf(cwd);
    if (!root || !isSetUp(root)) return null;
    const { handoff } = loadConfig(root);
    if (!handoff.enabled) return null;
    const edits = uncheckedEdits(root);
    const unchecked = edits.reduce((n, e) => n + e.lines, 0);
    if (unchecked - getNudgedLines(root) < handoff.minLines) return null;
    const cache = readZoneCache(root);
    const zones = new Set(edits.map((e) => cache?.[e.file] ?? dirname(e.file)));
    setNudgedLines(root, unchecked);
    return JSON.stringify({
      systemMessage: `Agents changed ~${unchecked} lines in ${zones.size} zones since your last check. Run /understanding-map:handoff for a 60-second check.`,
    });
  } catch {
    return null;
  }
}
