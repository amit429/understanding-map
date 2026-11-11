import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Config } from './types.js';

export const DEFAULT_CONFIG: Config = {
  mode: 'solo',
  zones: {},
  critical: [],
  exclude: [],
  threshold: 60,
  fadingFloor: 30,
  activeDays: 90,
  halfLifeDays: 180,
  historyDays: 730,
  handoff: { enabled: true, minLines: 50 },
  handles: {},
};

export class ConfigError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

export function umDir(root: string): string {
  return join(root, '.understanding');
}

function configPath(root: string): string {
  return join(umDir(root), 'config.json');
}

export function isSetUp(root: string): boolean {
  return existsSync(configPath(root));
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isStrArr = (v: unknown) => Array.isArray(v) && v.every((x) => typeof x === 'string');
const isNum = (v: unknown) => typeof v === 'number' && Number.isFinite(v);

function check(field: string, ok: boolean, expected: string): void {
  if (!ok) throw new ConfigError(field, `Invalid config: "${field}" must be ${expected}`);
}

function validate(raw: Record<string, unknown>): void {
  if ('mode' in raw) check('mode', raw.mode === 'solo' || raw.mode === 'team', '"solo" or "team"');
  if ('zones' in raw) {
    check('zones', isObj(raw.zones) && Object.values(raw.zones).every(isStrArr), 'an object of string arrays');
  }
  for (const f of ['critical', 'exclude'] as const) {
    if (f in raw) check(f, isStrArr(raw[f]), 'an array of strings');
  }
  for (const f of ['threshold', 'fadingFloor', 'activeDays', 'halfLifeDays', 'historyDays'] as const) {
    if (f in raw) check(f, isNum(raw[f]), 'a number');
  }
  if ('handoff' in raw) {
    const h = raw.handoff;
    check('handoff', isObj(h), 'an object');
    const ho = h as Record<string, unknown>;
    if ('enabled' in ho) check('handoff.enabled', typeof ho.enabled === 'boolean', 'a boolean');
    if ('minLines' in ho) check('handoff.minLines', isNum(ho.minLines), 'a number');
  }
  if ('handles' in raw) {
    check('handles', isObj(raw.handles) && Object.values(raw.handles).every((v) => typeof v === 'string'), 'an object of strings');
  }
}

export function loadConfig(root: string): Config {
  const path = configPath(root);
  if (!existsSync(path)) return structuredClone(DEFAULT_CONFIG);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    throw new ConfigError('config.json', `Could not parse ${path}: ${(e as Error).message}`);
  }
  if (!isObj(raw)) throw new ConfigError('config.json', `${path} must contain a JSON object`);
  validate(raw);
  const d = structuredClone(DEFAULT_CONFIG);
  const { handoff, ...rest } = raw as Partial<Config>;
  return { ...d, ...rest, handoff: { ...d.handoff, ...(handoff ?? {}) } };
}

/** Keeps .understanding/ out of git by default: writes `*` to its own .gitignore unless one already exists. */
export function ensureUnderstandingIgnore(root: string): void {
  const file = join(umDir(root), '.gitignore');
  if (existsSync(file)) return;
  mkdirSync(umDir(root), { recursive: true });
  writeFileSync(file, '*\n');
}
