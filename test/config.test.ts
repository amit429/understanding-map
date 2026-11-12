import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadConfig, DEFAULT_CONFIG, ConfigError } from '../src/config.js';
import { handleFor, sanitizeHandle } from '../src/identity.js';

function repoWith(config?: string): string {
  const root = mkdtempSync(join(tmpdir(), 'um-'));
  if (config !== undefined) {
    mkdirSync(join(root, '.understanding'));
    writeFileSync(join(root, '.understanding', 'config.json'), config);
  }
  return root;
}

describe('loadConfig', () => {
  it('returns defaults when no config file exists', () => {
    const c = loadConfig(repoWith());
    expect(c.mode).toBe('solo');
    expect(c.threshold).toBe(60);
    expect(c.fadingFloor).toBe(30);
    expect(c.activeDays).toBe(90);
    expect(c.halfLifeDays).toBe(180);
    expect(c.historyDays).toBe(730);
    expect(c.handoff).toEqual({ enabled: true, minLines: 50 });
    expect(c.githubReviews).toBe(false);
  });

  it('accepts githubReviews as a boolean and rejects anything else', () => {
    expect(loadConfig(repoWith('{"githubReviews":true}')).githubReviews).toBe(true);
    expect(() => loadConfig(repoWith('{"githubReviews":"yes"}'))).toThrow(/githubReviews/);
  });

  it('deep-merges a partial config', () => {
    const c = loadConfig(repoWith('{"mode":"team","handoff":{"minLines":80}}'));
    expect(c.mode).toBe('team');
    expect(c.handoff.minLines).toBe(80);
    expect(c.handoff.enabled).toBe(true);
  });

  it('throws ConfigError naming the bad field', () => {
    try {
      loadConfig(repoWith('{"threshold":"high"}'));
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(ConfigError);
      expect((e as ConfigError).field).toBe('threshold');
    }
  });
});

describe('handleFor', () => {
  it('derives a handle from the email local part', () => {
    expect(handleFor('Priya.S@corp.io', DEFAULT_CONFIG)).toBe('priya.s');
    expect(handleFor('a b@x.y', DEFAULT_CONFIG)).toBe('a-b');
  });
  it('lets config.handles override', () => {
    const cfg = { ...DEFAULT_CONFIG, handles: { 'p@x.io': 'priya' } };
    expect(handleFor('p@x.io', cfg)).toBe('priya');
  });
  it('sanitises every handle, including config.handles values, to a safe file name', () => {
    const cfg = { ...DEFAULT_CONFIG, handles: { 'p@x.io': 'Priya S/../../etc', 'dot@x.io': '.', 'dots@x.io': '..', 'e@x.io': '' } };
    expect(handleFor('p@x.io', cfg)).toBe('priya-s-..-..-etc');
    for (const email of ['dot@x.io', 'dots@x.io', '..@x.io', '.@x.io', '@x.io', 'e@x.io']) {
      const h = handleFor(email, cfg);
      expect(h).toMatch(/^[a-z0-9._-]+$/);
      expect(['', '.', '..']).not.toContain(h);
    }
    expect(handleFor('constructor', DEFAULT_CONFIG)).toBe('constructor');
    expect(sanitizeHandle('Zoë')).toBe('zo-');
  });
});
