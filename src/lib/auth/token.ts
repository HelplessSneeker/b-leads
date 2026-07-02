import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { getTokenSecret } from './config';

/**
 * Magic-link tokens. Two layers of defense:
 *
 * 1. HMAC-signed payload (`<b64(payload)>.<b64(sig)>`) — a forged token
 *    is rejected without a DB hit.
 * 2. SHA-256 of the whole token is stored in `auth_tokens.token_hash`,
 *    checked and marked consumed inside a transaction — a leaked DB
 *    cannot be replayed against /auth/verify.
 */

interface Payload {
  jti: string;
  email: string;
  exp: number;
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str: string): Buffer {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

function sign(payload: string): string {
  return b64url(createHmac('sha256', getTokenSecret()).update(payload).digest());
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export interface IssuedToken {
  token: string;
  hash: string;
  jti: string;
  expiresAt: Date;
}

export function issueToken(email: string, ttlMs: number, now = Date.now()): IssuedToken {
  const jti = b64url(randomBytes(16));
  const exp = now + ttlMs;
  const payload: Payload = { jti, email: email.toLowerCase(), exp };
  const payloadStr = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = sign(payloadStr);
  const token = `${payloadStr}.${sig}`;
  return { token, hash: hashToken(token), jti, expiresAt: new Date(exp) };
}

export type VerifyResult =
  | { ok: true; email: string; jti: string; expiresAt: Date }
  | { ok: false; reason: 'malformed' | 'bad_signature' | 'expired' };

export function verifyToken(token: string, now = Date.now()): VerifyResult {
  const parts = token.split('.');
  if (parts.length !== 2) return { ok: false, reason: 'malformed' };
  const [payloadStr, sig] = parts;

  const expectedSig = sign(payloadStr);
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: 'bad_signature' };
  }

  let payload: Payload;
  try {
    payload = JSON.parse(b64urlDecode(payloadStr).toString('utf8')) as Payload;
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  if (
    typeof payload.jti !== 'string' ||
    typeof payload.email !== 'string' ||
    typeof payload.exp !== 'number'
  ) {
    return { ok: false, reason: 'malformed' };
  }
  if (payload.exp < now) return { ok: false, reason: 'expired' };

  return { ok: true, email: payload.email, jti: payload.jti, expiresAt: new Date(payload.exp) };
}
