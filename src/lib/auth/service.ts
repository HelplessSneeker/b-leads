import { and, eq, isNull, lt } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { authTokens, users } from '~/db/schema';
import { getMailProvider } from '~/lib/mail';
import { getBaseUrl, getTokenTtlMs, isEmailAllowed } from './config';
import { hashToken, issueToken, verifyToken } from './token';

// Kept schema-generic like the leads/activities services so unit tests can
// pass a bare BetterSQLite3Database<Record<string, never>> from migrate().
type AuthDb<S extends Record<string, unknown>> = BetterSQLite3Database<S>;

/**
 * Result of a login request. `sent` is the same for allow-listed and rejected
 * emails so an attacker cannot enumerate allowed users via response timing or
 * shape. `sent` is only false on hard infra failure (mail send throws).
 */
export interface RequestLoginResult {
  sent: boolean;
}

/**
 * Request a magic-link. Non-allowlisted addresses are silently accepted (no
 * mail sent, no DB row written) — they receive the same shape as a valid
 * request. Allowed addresses get a signed, single-use token by email.
 */
export async function requestLogin<S extends Record<string, unknown>>(
  db: AuthDb<S>,
  rawEmail: string,
): Promise<RequestLoginResult> {
  const email = rawEmail.trim().toLowerCase();
  if (!isEmailAllowed(email)) return { sent: true };

  // Housekeeping: drop expired tokens for this address before issuing a fresh
  // one. Old unused tokens stay valid until they expire — that's fine, but
  // once expired they are dead weight.
  db.delete(authTokens)
    .where(and(eq(authTokens.email, email), lt(authTokens.expiresAt, new Date())))
    .run();

  const ttl = getTokenTtlMs();
  const issued = issueToken(email, ttl);
  db.insert(authTokens)
    .values({
      tokenHash: issued.hash,
      email,
      expiresAt: issued.expiresAt,
    })
    .run();

  const url = `${getBaseUrl()}/auth/verify?token=${encodeURIComponent(issued.token)}`;
  const ttlMinutes = Math.round(ttl / 60000);
  await getMailProvider().send({
    to: email,
    subject: 'b-leads Login-Link',
    text:
      `Klick auf den Link, um dich einzuloggen (gültig ${ttlMinutes} Minuten):\n\n${url}\n\n` +
      'Wenn du das nicht warst, ignoriere diese Mail — der Link läuft von selbst ab.',
  });
  return { sent: true };
}

export type ConsumeTokenResult =
  | { ok: true; userId: string; email: string }
  | { ok: false; reason: 'invalid' | 'expired' | 'consumed' | 'not_allowed' };

/**
 * Verify a magic-link token and, on success, upsert the user and mark the
 * token consumed. The consume + upsert runs inside a single SQLite
 * transaction so double-clicks or replayed URLs cannot mint two sessions.
 */
export function consumeToken<S extends Record<string, unknown>>(
  db: AuthDb<S>,
  token: string,
  now = new Date(),
): ConsumeTokenResult {
  const verified = verifyToken(token, now.getTime());
  if (!verified.ok) {
    return { ok: false, reason: verified.reason === 'expired' ? 'expired' : 'invalid' };
  }

  // Belt-and-braces: reject tokens whose email has since been removed from
  // the allowlist. Signature + DB alone would otherwise let a revoked user
  // still log in with an outstanding link.
  if (!isEmailAllowed(verified.email)) return { ok: false, reason: 'not_allowed' };

  const hash = hashToken(token);
  return db.transaction((tx): ConsumeTokenResult => {
    const row = tx.select().from(authTokens).where(eq(authTokens.tokenHash, hash)).get();
    if (!row) return { ok: false, reason: 'invalid' };
    if (row.consumedAt) return { ok: false, reason: 'consumed' };
    if (row.expiresAt.getTime() < now.getTime()) return { ok: false, reason: 'expired' };

    tx.update(authTokens).set({ consumedAt: now }).where(eq(authTokens.id, row.id)).run();

    const existing = tx.select().from(users).where(eq(users.email, verified.email)).get();
    if (existing) {
      tx.update(users).set({ lastLoginAt: now }).where(eq(users.id, existing.id)).run();
      return { ok: true, userId: existing.id, email: existing.email };
    }
    const inserted = tx
      .insert(users)
      .values({ email: verified.email, lastLoginAt: now })
      .returning()
      .get();
    return { ok: true, userId: inserted.id, email: inserted.email };
  });
}

/**
 * Garbage-collect consumed + expired tokens. Not wired to a cron; called
 * opportunistically at the top of consumeToken paths keeps the table bounded
 * without a separate scheduler.
 */
export function purgeStaleTokens<S extends Record<string, unknown>>(
  db: AuthDb<S>,
  now = new Date(),
): number {
  const res = db
    .delete(authTokens)
    .where(and(isNull(authTokens.consumedAt), lt(authTokens.expiresAt, now)))
    .run();
  return res.changes;
}
