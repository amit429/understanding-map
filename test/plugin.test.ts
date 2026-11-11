import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { commands } from '../src/cli';

const ROOT = join(__dirname, '..');
const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

/** Minimal frontmatter reader: `key: value` lines between the leading `---` fences. */
function frontmatter(text: string): Record<string, string> {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!m) return {};
  const out: Record<string, string> = {};
  for (const line of m[1].split('\n')) {
    const kv = /^([A-Za-z-]+):\s*(.*)$/.exec(line);
    if (kv) out[kv[1]] = kv[2].trim().replace(/^"(.*)"$/, '$1');
  }
  return out;
}

const SKILLS = ['setup', 'map', 'learn', 'handoff', 'who'];
const skillText = (name: string) => read(`skills/${name}/SKILL.md`);
const umapCommands = (text: string) => [...text.matchAll(/umap\.js"?\s+([a-z][a-z-]*)/g)].map((m) => m[1]);

describe('plugin manifest', () => {
  it('parses and has name, version and description', () => {
    const p = JSON.parse(read('.claude-plugin/plugin.json'));
    expect(p.name).toBe('understanding-map');
    expect(typeof p.version).toBe('string');
    expect(p.version.length).toBeGreaterThan(0);
    expect(typeof p.description).toBe('string');
    expect(p.description.length).toBeGreaterThan(0);
  });
});

describe('skills', () => {
  it('exist for exactly the five commands', () => {
    const dirs = readdirSync(join(ROOT, 'skills')).filter((d) => existsSync(join(ROOT, 'skills', d, 'SKILL.md')));
    expect(dirs.sort()).toEqual([...SKILLS].sort());
  });

  it.each(SKILLS)('%s has frontmatter name and description', (name) => {
    const fm = frontmatter(skillText(name));
    expect(fm.name).toBe(name);
    expect(fm.description?.length ?? 0).toBeGreaterThan(20);
  });

  it.each(SKILLS)('%s only calls engine commands that exist in src/cli.ts', (name) => {
    const used = umapCommands(skillText(name));
    expect(used.length).toBeGreaterThan(0);
    for (const cmd of used) expect(Object.keys(commands), `${name} calls unknown command "${cmd}"`).toContain(cmd);
  });

  it.each(SKILLS)('%s says how to locate the engine (skill base directory, plugin root fallback)', (name) => {
    const text = skillText(name);
    expect(text).toContain('Base directory for this skill');
    expect(text).toContain('/../../dist/umap.js');
    expect(text).toContain('${CLAUDE_PLUGIN_ROOT}/dist/umap.js');
  });

  it('learn verifies questions, handles unverifiable zones and records sessions', () => {
    const text = skillText('learn');
    expect(text).toContain('answer-key-checker');
    expect(text).toContain('unverifiable');
    expect(text).toContain('record --kind session');
  });

  it('handoff verifies questions, records handoffs and supports skipping', () => {
    const text = skillText('handoff');
    expect(text).toContain('answer-key-checker');
    expect(text).toContain('record --kind handoff');
    expect(text).toContain('handoff-skip');
  });
});

describe('answer-key-checker agent', () => {
  it('has a name, a description and exactly the tools Read, Grep, Glob', () => {
    const fm = frontmatter(read('agents/answer-key-checker.md'));
    expect(fm.name).toBe('answer-key-checker');
    expect(fm.description?.length ?? 0).toBeGreaterThan(20);
    expect(fm.tools.split(',').map((t) => t.trim()).sort()).toEqual(['Glob', 'Grep', 'Read']);
  });
});

describe('hooks.json', () => {
  it('matches the Task 12 hooks', () => {
    expect(JSON.parse(read('hooks/hooks.json'))).toEqual({
      hooks: {
        PostToolUse: [{
          matcher: 'Edit|Write|MultiEdit|NotebookEdit',
          hooks: [{ type: 'command', command: 'node "${CLAUDE_PLUGIN_ROOT}/dist/umap.js" hook post-tool-use' }],
        }],
        Stop: [{ hooks: [{ type: 'command', command: 'node "${CLAUDE_PLUGIN_ROOT}/dist/umap.js" hook stop' }] }],
      },
    });
    expect(Object.keys(commands)).toContain('hook');
  });
});

describe('README', () => {
  it('names all five commands and says scores are estimates', () => {
    const text = read('README.md');
    for (const s of SKILLS) expect(text).toContain(`/understanding-map:${s}`);
    expect(text.toLowerCase()).toContain('estimate');
  });
});
