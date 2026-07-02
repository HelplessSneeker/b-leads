import { afterEach, describe, expect, it } from 'vitest';
import { getTokenTtlMs, isEmailAllowed } from './config';

describe('isEmailAllowed', () => {
  const original = process.env.AUTH_ALLOWLIST;

  afterEach(() => {
    if (original === undefined) delete process.env.AUTH_ALLOWLIST;
    else process.env.AUTH_ALLOWLIST = original;
  });

  it('accepts an exact match', () => {
    process.env.AUTH_ALLOWLIST = 'bfn@example.com';
    expect(isEmailAllowed('bfn@example.com')).toBe(true);
  });

  it('normalises whitespace and case on both sides', () => {
    process.env.AUTH_ALLOWLIST = '  BFN@Example.COM , second@example.com ';
    expect(isEmailAllowed('bfn@EXAMPLE.com')).toBe(true);
    expect(isEmailAllowed(' second@example.com ')).toBe(true);
  });

  it('rejects addresses not in the list', () => {
    process.env.AUTH_ALLOWLIST = 'bfn@example.com';
    expect(isEmailAllowed('someone@else.com')).toBe(false);
  });

  it('rejects everything when the list is empty', () => {
    process.env.AUTH_ALLOWLIST = '';
    expect(isEmailAllowed('bfn@example.com')).toBe(false);
  });

  it('rejects everything when the list is undefined', () => {
    delete process.env.AUTH_ALLOWLIST;
    expect(isEmailAllowed('bfn@example.com')).toBe(false);
  });
});

describe('getTokenTtlMs', () => {
  const original = process.env.AUTH_TOKEN_TTL_MINUTES;

  afterEach(() => {
    if (original === undefined) delete process.env.AUTH_TOKEN_TTL_MINUTES;
    else process.env.AUTH_TOKEN_TTL_MINUTES = original;
  });

  it('defaults to 15 minutes', () => {
    delete process.env.AUTH_TOKEN_TTL_MINUTES;
    expect(getTokenTtlMs()).toBe(15 * 60 * 1000);
  });

  it('honours a valid override', () => {
    process.env.AUTH_TOKEN_TTL_MINUTES = '5';
    expect(getTokenTtlMs()).toBe(5 * 60 * 1000);
  });

  it('falls back to default on garbage input', () => {
    process.env.AUTH_TOKEN_TTL_MINUTES = 'not-a-number';
    expect(getTokenTtlMs()).toBe(15 * 60 * 1000);
  });

  it('falls back to default on non-positive input', () => {
    process.env.AUTH_TOKEN_TTL_MINUTES = '0';
    expect(getTokenTtlMs()).toBe(15 * 60 * 1000);
  });
});
