import { describe, expect, it } from 'vitest';
import { startOfTomorrowVienna } from './date';

describe('startOfTomorrowVienna', () => {
  it('treats a follow-up dated today as due at 00:30 Vienna (the UTC-offset edge)', () => {
    // 00:30 on the 18th in Vienna (CEST, +02:00) is still the 17th 22:30 in UTC.
    const now = new Date('2026-06-17T22:30:00.000Z');
    const threshold = startOfTomorrowVienna(now);

    expect(threshold).toEqual(new Date('2026-06-19T00:00:00.000Z'));
    // A follow-up dated "today" (stored as UTC midnight) is below the bound...
    expect(new Date('2026-06-18T00:00:00.000Z') < threshold).toBe(true);
    // ...one dated "tomorrow" is not.
    expect(new Date('2026-06-19T00:00:00.000Z') < threshold).toBe(false);
  });

  it('works across a winter CET (+01:00) date', () => {
    // 00:30 on Jan 11th in Vienna (CET, +01:00) is Jan 10th 23:30 UTC.
    const now = new Date('2026-01-10T23:30:00.000Z');
    expect(startOfTomorrowVienna(now)).toEqual(new Date('2026-01-12T00:00:00.000Z'));
  });
});
