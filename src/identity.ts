import type { Config } from './types.js';

/** Handles name shared files: only [a-z0-9._-], never empty, '.' or '..' (those become "unknown"). */
export function sanitizeHandle(s: string): string {
  const h = s.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
  return h === '' || h === '.' || h === '..' ? 'unknown' : h;
}

/** Shared files store a handle, never the full email. `config.handles` maps emails (or GitHub logins) to handles. */
export function handleFor(email: string, config: Config): string {
  const override = Object.hasOwn(config.handles, email) ? config.handles[email] : '';
  return sanitizeHandle(override || email.split('@')[0]);
}
