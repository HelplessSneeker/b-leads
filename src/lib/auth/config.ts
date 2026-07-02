/**
 * Auth config: allowlist + token TTL + base URL.
 *
 * All reads happen lazily so tests can inject env vars per case.
 */

export function getAllowlist(): Set<string> {
  const raw = process.env.AUTH_ALLOWLIST ?? '';
  const emails = raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);
  return new Set(emails);
}

export function isEmailAllowed(email: string): boolean {
  return getAllowlist().has(email.trim().toLowerCase());
}

export function getTokenSecret(): string {
  const secret = process.env.AUTH_TOKEN_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_TOKEN_SECRET must be set and at least 32 bytes long.');
  }
  return secret;
}

export function getTokenTtlMs(): number {
  const raw = process.env.AUTH_TOKEN_TTL_MINUTES;
  const minutes = raw ? Number.parseInt(raw, 10) : 15;
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return 15 * 60 * 1000;
  }
  return minutes * 60 * 1000;
}

export function getBaseUrl(): string {
  const raw = process.env.APP_BASE_URL ?? 'http://localhost:4321';
  return raw.replace(/\/+$/, '');
}
