import type { LeadStatus } from '~/db/schema';

// German display labels for the lead pipeline statuses (English keys in the DB).
export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Neu',
  contacted: 'Kontaktiert',
  replied: 'Geantwortet',
  qualified: 'Qualifiziert',
  won: 'Gewonnen',
  lost: 'Verloren',
};

// Status-tag color modifier per status (pairs with the `.tag` base class, both
// defined in global.css @layer components). Squared tags, not pills — they read
// as data, not badges. Light/dark tints + tabular type live in the CSS tokens.
export const STATUS_CLASSES: Record<LeadStatus, string> = {
  new: 'tag-new',
  contacted: 'tag-contacted',
  replied: 'tag-replied',
  qualified: 'tag-qualified',
  won: 'tag-won',
  lost: 'tag-lost',
};
