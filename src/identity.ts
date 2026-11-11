import type { Config } from './types.js';

/** Shared files store a handle, never the full email. */
export function handleFor(email: string, config: Config): string {
  const override = config.handles[email];
  if (override) return override;
  return email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '-');
}
