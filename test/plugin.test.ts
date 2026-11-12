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

const SKILLS = ['setup', 'map', 'learn', 'handoff', 'who', 'visualize'];
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
  it('exist for exactly the six commands', () => {
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

  it.each(['learn', 'handoff', 'visualize'])('%s treats anything but an explicit "confirmed": true as unconfirmed', (name) => {
    const text = skillText(name);
    expect(text).toContain('`"confirmed": true`');
    expect(text).toMatch(/missing id, malformed or non-JSON output, or an error/);
  });

  it.each(SKILLS)('%s quotes zone ids and paths in every engine command', (name) => {
    const text = skillText(name);
    expect(text).not.toMatch(/--zones? <|umap\.js" (zone|who|context|visualize) </);
  });

  it('visualize gets context, checks the cache, verifies every claim and renders, but never records', () => {
    const text = skillText('visualize');
    expect(frontmatter(text)['argument-hint']).toBe('[zone or path]');
    for (const s of ['umap.js" context', '--cached --json', 'answer-key-checker', 'storyboard claims', '--storyboard', 'unverifiable --zone', '/understanding-map:learn']) {
      expect(text).toContain(s);
    }
    expect(text).not.toMatch(/umap\.js" record\b/);
    expect(text).toContain('`outcome`: "the last stop leads to');
    expect(text).toMatch(/unconfirmed outcome is dropped/i);
    expect(text).toMatch(/absolute path/);
    expect(text.toLowerCase()).toContain('never record');
  });

  it('learn offers the visual at the end', () => {
    expect(skillText('learn')).toContain('Want to see it? /understanding-map:visualize');
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

  it('also checks storyboard claims, with the same output format', () => {
    const text = read('agents/answer-key-checker.md');
    expect(text).toContain('Storyboard claims');
    for (const kind of ['hop', 'role', 'step', 'order', 'gotcha', 'outcome']) expect(text).toContain(`\`${kind}\``);
  });
});

describe('hooks.json', () => {
  it('matches the Task 12 hooks, guarded so a missing node never fails a hook', () => {
    const cmd = (event: string) => `command -v node >/dev/null 2>&1 && node "\${CLAUDE_PLUGIN_ROOT}/dist/umap.js" hook ${event} || true`;
    expect(JSON.parse(read('hooks/hooks.json'))).toEqual({
      hooks: {
        PostToolUse: [{
          matcher: 'Edit|Write|MultiEdit|NotebookEdit',
          hooks: [{ type: 'command', command: cmd('post-tool-use') }],
        }],
        Stop: [{ hooks: [{ type: 'command', command: cmd('stop') }] }],
      },
    });
    expect(Object.keys(commands)).toContain('hook');
  });
});

describe('README', () => {
  it('names all six commands and says scores are estimates', () => {
    const text = read('README.md');
    for (const s of SKILLS) expect(text).toContain(`/understanding-map:${s}`);
    expect(text.toLowerCase()).toContain('estimate');
  });
});
