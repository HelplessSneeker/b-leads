import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { authTokens, users } from '~/db/schema';
import { resetMailProvider } from '~/lib/mail';
import { consumeToken, requestLogin } from './service';
import { issueToken } from './token';

function freshDb() {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  const db = drizzle(sqlite, { casing: 'snake_case' });
  migrate(db, { migrationsFolder: './drizzle' });
  return db;
}

const SECRET = 'a'.repeat(48);

describe('requestLogin', () => {
  let db: ReturnType<typeof freshDb>;
  const originals: Record<string, string | undefined> = {};

  beforeEach(() => {
    db = freshDb();
    originals.ALLOW = process.env.AUTH_ALLOWLIST;
    originals.SECRET = process.env.AUTH_TOKEN_SECRET;
    originals.PROV = process.env.MAIL_PROVIDER;
    process.env.AUTH_ALLOWLIST = 'bfn@example.com';
    process.env.AUTH_TOKEN_SECRET = SECRET;
    process.env.MAIL_PROVIDER = 'mock';
    resetMailProvider();
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(originals)) {
      const key =
        k === 'ALLOW' ? 'AUTH_ALLOWLIST' : k === 'SECRET' ? 'AUTH_TOKEN_SECRET' : 'MAIL_PROVIDER';
      if (v === undefined) delete process.env[key];
      else process.env[key] = v;
    }
    resetMailProvider();
  });

  it('writes an auth_tokens row for an allow-listed address', async () => {
    const before = db.select().from(authTokens).all();
    expect(before).toHaveLength(0);

    const r = await requestLogin(db, 'bfn@example.com');
    expect(r).toEqual({ sent: true });

    const after = db.select().from(authTokens).all();
    expect(after).toHaveLength(1);
    expect(after[0].email).toBe('bfn@example.com');
    expect(after[0].consumedAt).toBeNull();
  });

  it('is silent for non-allow-listed addresses — same shape, no DB write', async () => {
    const r = await requestLogin(db, 'stranger@example.com');
    expect(r).toEqual({ sent: true });
    expect(db.select().from(authTokens).all()).toHaveLength(0);
  });

  it('normalises the requested email (case + whitespace)', async () => {
    await requestLogin(db, '  BFN@Example.COM ');
    const rows = db.select().from(authTokens).all();
    expect(rows).toHaveLength(1);
    expect(rows[0].email).toBe('bfn@example.com');
  });

  it('propagates infra failures — so the action handler can normalise the shape', async () => {
    // Inject a broken mail provider directly — provider-agnostic, doesn't rely
    // on a specific transport being wired up.
    resetMailProvider({
      send: async () => {
        throw new Error('mail transport down');
      },
    });
    await expect(requestLogin(db, 'bfn@example.com')).rejects.toBeTruthy();
    // Token row is committed *before* the mail send throws — the action
    // handler in src/actions/auth.ts swallows the throw and returns a uniform
    // response shape.
    expect(db.select().from(authTokens).all()).toHaveLength(1);
  });
});

describe('consumeToken', () => {
  let db: ReturnType<typeof freshDb>;
  const originals: Record<string, string | undefined> = {};

  beforeEach(() => {
    db = freshDb();
    originals.ALLOW = process.env.AUTH_ALLOWLIST;
    originals.SECRET = process.env.AUTH_TOKEN_SECRET;
    process.env.AUTH_ALLOWLIST = 'bfn@example.com';
    process.env.AUTH_TOKEN_SECRET = SECRET;
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(originals)) {
      const key = k === 'ALLOW' ? 'AUTH_ALLOWLIST' : 'AUTH_TOKEN_SECRET';
      if (v === undefined) delete process.env[key];
      else process.env[key] = v;
    }
  });

  function seed(email: string) {
    const issued = issueToken(email, 60_000);
    db.insert(authTokens)
      .values({ tokenHash: issued.hash, email, expiresAt: issued.expiresAt })
      .run();
    return issued;
  }

  it('mints a user + returns ok on first use', () => {
    const { token } = seed('bfn@example.com');
    const r = consumeToken(db, token);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.email).toBe('bfn@example.com');
      const user = db.select().from(users).get();
      expect(user?.email).toBe('bfn@example.com');
      expect(user?.lastLoginAt).toBeTruthy();
    }
  });

  it('rejects the second use of a single-use token', () => {
    const { token } = seed('bfn@example.com');
    const first = consumeToken(db, token);
    expect(first.ok).toBe(true);
    const second = consumeToken(db, token);
    expect(second).toEqual({ ok: false, reason: 'consumed' });
  });

  it('reuses an existing user and updates lastLoginAt on subsequent logins', () => {
    const first = seed('bfn@example.com');
    const r1 = consumeToken(db, first.token);
    expect(r1.ok).toBe(true);
    const userIdFirst = r1.ok ? r1.userId : '';

    const second = seed('bfn@example.com');
    const r2 = consumeToken(db, second.token);
    expect(r2.ok).toBe(true);
    if (r2.ok) expect(r2.userId).toBe(userIdFirst);

    // Only one user row despite two logins.
    expect(db.select().from(users).all()).toHaveLength(1);
  });

  it('rejects tokens whose email is no longer allow-listed', () => {
    const { token } = seed('bfn@example.com');
    process.env.AUTH_ALLOWLIST = '';
    expect(consumeToken(db, token)).toEqual({ ok: false, reason: 'not_allowed' });
  });

  it('rejects expired tokens', () => {
    const issued = issueToken('bfn@example.com', 60_000);
    db.insert(authTokens)
      .values({ tokenHash: issued.hash, email: 'bfn@example.com', expiresAt: issued.expiresAt })
      .run();
    // Verify at a time past exp.
    const r = consumeToken(db, issued.token, new Date(issued.expiresAt.getTime() + 1_000));
    expect(r).toEqual({ ok: false, reason: 'expired' });
  });

  it('rejects a forged / malformed token', () => {
    expect(consumeToken(db, 'not-a-token')).toEqual({ ok: false, reason: 'invalid' });
  });

  it('rejects a token that never made it to the DB (leaked, replayed)', () => {
    const issued = issueToken('bfn@example.com', 60_000);
    // Note: intentionally *not* inserted into auth_tokens.
    expect(consumeToken(db, issued.token)).toEqual({ ok: false, reason: 'invalid' });
  });
});
