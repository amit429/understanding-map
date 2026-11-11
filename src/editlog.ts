import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { umDir } from './config.js';
import type { EditLogEntry } from './types.js';

interface Handoff { checkedUpTo: string; nudgedLines: number }

const localDir = (root: string) => join(umDir(root), 'local');
const editsPath = (root: string) => join(localDir(root), 'edits.jsonl');
const handoffPath = (root: string) => join(localDir(root), 'handoff.json');

export function appendEdit(root: string, e: EditLogEntry): void {
  mkdirSync(localDir(root), { recursive: true });
  appendFileSync(editsPath(root), JSON.stringify(e) + '\n');
}

export function readEdits(root: string): EditLogEntry[] {
  let text: string;
  try {
    text = readFileSync(editsPath(root), 'utf8');
  } catch {
    return [];
  }
  const out: EditLogEntry[] = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line) as EditLogEntry);
    } catch { /* skip corrupt line */ }
  }
  return out;
}

function readHandoff(root: string): Handoff {
  try {
    const v = JSON.parse(readFileSync(handoffPath(root), 'utf8')) as Partial<Handoff>;
    return {
      checkedUpTo: typeof v.checkedUpTo === 'string' ? v.checkedUpTo : '',
      nudgedLines: typeof v.nudgedLines === 'number' ? v.nudgedLines : 0,
    };
  } catch {
    return { checkedUpTo: '', nudgedLines: 0 };
  }
}

function writeHandoff(root: string, h: Handoff): void {
  mkdirSync(localDir(root), { recursive: true });
  writeFileSync(handoffPath(root), JSON.stringify(h));
}

export function uncheckedEdits(root: string): EditLogEntry[] {
  const { checkedUpTo } = readHandoff(root);
  return readEdits(root).filter((e) => e.ts > checkedUpTo);
}

export function markChecked(root: string, upToTs: string): void {
  writeHandoff(root, { checkedUpTo: upToTs, nudgedLines: 0 });
}

export function getNudgedLines(root: string): number {
  return readHandoff(root).nudgedLines;
}

export function setNudgedLines(root: string, n: number): void {
  writeHandoff(root, { ...readHandoff(root), nudgedLines: n });
}
