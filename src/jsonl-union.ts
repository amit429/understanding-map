import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { listAtRef, showAtRef } from './git.js';

function countLines(text: string): Map<string, number> {
  const m = new Map<string, number>();
  for (const line of text.split('\n')) if (line.trim()) m.set(line, (m.get(line) ?? 0) + 1);
  return m;
}

/**
 * For each *.jsonl file name in `<root>/<dirRel>` (working tree) and at `defaultRef`, returns the file's lines
 * with max(count in working tree, count at ref) copies per distinct line. Never merges across file names.
 */
export function readJsonlUnion(root: string, dirRel: string, defaultRef: string | null): Map<string, string[]> {
  const counts = new Map<string, Map<string, number>>();
  const merge = (name: string, text: string) => {
    const cur = counts.get(name) ?? counts.set(name, new Map()).get(name)!;
    for (const [line, n] of countLines(text)) cur.set(line, Math.max(cur.get(line) ?? 0, n));
  };
  const dir = join(root, dirRel);
  if (existsSync(dir)) {
    for (const n of readdirSync(dir).filter((x) => x.endsWith('.jsonl')).sort()) {
      try {
        merge(n, readFileSync(join(dir, n), 'utf8'));
      } catch { /* skip */ }
    }
  }
  if (defaultRef) {
    for (const p of listAtRef(root, defaultRef, dirRel)) {
      if (!p.endsWith('.jsonl')) continue;
      const t = showAtRef(root, defaultRef, p);
      if (t !== null) merge(p.slice(p.lastIndexOf('/') + 1), t);
    }
  }
  const out = new Map<string, string[]>();
  for (const [name, lines] of counts) {
    const arr: string[] = [];
    for (const [line, n] of lines) for (let k = 0; k < n; k++) arr.push(line);
    out.set(name, arr);
  }
  return out;
}
