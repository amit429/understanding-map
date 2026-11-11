import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { machineId } from './attribution.js';
import { SOLO_IGNORE, TEAM_IGNORE, umDir } from './config.js';
import type { Config } from './types.js';

const TEAM_ATTRIBUTES = [
  '.understanding/events/*.jsonl merge=union',
  '.understanding/agent-share/*.jsonl merge=union',
];

/** Writes .understanding/config.json and its own ignore rules; never touches git state or the root .gitignore. */
export function runSetup(
  root: string,
  opts: { mode: Config['mode']; critical: string[] },
): { configPath: string; gitignoreLines: string[]; gitattributesLines: string[] } {
  const dir = umDir(root);
  mkdirSync(dir, { recursive: true });

  const configPath = join(dir, 'config.json');
  let existing: Record<string, unknown> = {};
  if (existsSync(configPath)) {
    try {
      const raw = JSON.parse(readFileSync(configPath, 'utf8'));
      if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) existing = raw;
    } catch { /* unreadable config is replaced */ }
  }
  writeFileSync(configPath, JSON.stringify({ ...existing, mode: opts.mode, critical: opts.critical }, null, 2) + '\n');

  const ignore = opts.mode === 'team' ? TEAM_IGNORE : SOLO_IGNORE;
  const gitignoreLines = ignore.trimEnd().split('\n');
  writeFileSync(join(dir, '.gitignore'), ignore);

  const gitattributesLines: string[] = [];
  if (opts.mode === 'team') {
    const attrPath = join(root, '.gitattributes');
    const current = existsSync(attrPath) ? readFileSync(attrPath, 'utf8') : '';
    const have = new Set(current.split(/\r?\n/).map((l) => l.trim()));
    gitattributesLines.push(...TEAM_ATTRIBUTES.filter((l) => !have.has(l)));
    if (gitattributesLines.length > 0) {
      const sep = current === '' || current.endsWith('\n') ? '' : '\n';
      writeFileSync(attrPath, current + sep + gitattributesLines.join('\n') + '\n');
    }
  }

  machineId(root);
  return { configPath, gitignoreLines, gitattributesLines };
}
