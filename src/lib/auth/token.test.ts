import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { hashToken, issueToken, verifyToken } from './token';

const SECRET_A = 'a'.repeat(48);
const SECRET_B = 'b'.repeat(48);

describe('token', () => {
  const original = process.env.AUTH_TOKEN_SECRET;

  beforeEach(() => {
    process.env.AUTH_TOKEN_SECRET = SECRET_A;
  });

  afterEach(() => {
    if (original === undefined) delete process.env.AUTH_TOKEN_SECRET;
    else process.env.AUTH_TOKEN_SECRET = original;
  });

  it('issues a valid signed token that verifies back to the same email', () => {
    const now = 1_700_000_000_000;
    const { token } = issueToken('bfn@example.com', 60_000, now);
    const r = verifyToken(token, now + 1_000);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.email).toBe('bfn@example.com');
  });

  it('normalises the email to lowercase on issue', () => {
    const now = 1_700_000_000_000;
    const { token } = issueToken('BFN@Example.COM', 60_000, now);
    const r = verifyToken(token, now);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.email).toBe('bfn@example.com');
  });

  it('rejects expired tokens', () => {
    const now = 1_700_000_000_000;
    const { token } = issueToken('bfn@example.com', 60_000, now);
    const r = verifyToken(token, now + 61_000);
    expect(r).toEqual({ ok: false, reason: 'expired' });
  });

  it('rejects a forged signature', () => {
    const now = 1_700_000_000_000;
    const { token } = issueToken('bfn@example.com', 60_000, now);
    const [payload] = token.split('.');
    const tampered = `${payload}.notarealsig`;
    expect(verifyToken(tampered, now)).toEqual({ ok: false, reason: 'bad_signature' });
  });

  it('rejects a token signed with a different secret', () => {
    const now = 1_700_000_000_000;
    const { token } = issueToken('bfn@example.com', 60_000, now);

    process.env.AUTH_TOKEN_SECRET = SECRET_B;
    expect(verifyToken(token, now)).toEqual({ ok: false, reason: 'bad_signature' });
  });

  it('rejects malformed tokens', () => {
    expect(verifyToken('not-a-token').ok).toBe(false);
    expect(verifyToken('').ok).toBe(false);
    expect(verifyToken('one.two.three').ok).toBe(false);
  });

  it('produces distinct tokens across issuances (jti differs)', () => {
    const now = 1_700_000_000_000;
    const a = issueToken('bfn@example.com', 60_000, now);
    const b = issueToken('bfn@example.com', 60_000, now);
    expect(a.token).not.toBe(b.token);
    expect(a.jti).not.toBe(b.jti);
    expect(a.hash).not.toBe(b.hash);
  });

  it('hashToken is deterministic', () => {
    const now = 1_700_000_000_000;
    const { token, hash } = issueToken('bfn@example.com', 60_000, now);
    expect(hashToken(token)).toBe(hash);
    expect(hashToken(token)).toBe(hashToken(token));
  });
});
