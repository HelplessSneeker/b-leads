import { db } from '~/db';
import { leads } from '~/db/schema';

// Seed values for the source datalist so the dropdown is useful on a fresh DB.
// `source` is a free-text field (the datalist only suggests, it doesn't restrict),
// so this is just a starting point — distinct existing values get merged in.
export const DEFAULT_SOURCES = ['outreach-wave-1', 'referral', 'linkedin', 'cold-email'];

/** Defaults merged with the distinct `source` values already in the DB, deduped + sorted. */
export function getSources(): string[] {
  const existing = db
    .selectDistinct({ source: leads.source })
    .from(leads)
    .orderBy(leads.source)
    .all()
    .map((r) => r.source);
  return [...new Set([...DEFAULT_SOURCES, ...existing])].sort();
}
