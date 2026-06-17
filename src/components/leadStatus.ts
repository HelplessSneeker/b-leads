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

// Pill colors per spec. Keep these as complete literal strings so the Tailwind v4
// JIT scanner picks them up (no dynamic concatenation).
export const STATUS_CLASSES: Record<LeadStatus, string> = {
  new: 'bg-gray-100 text-gray-700',
  contacted: 'bg-blue-100 text-blue-700',
  replied: 'bg-violet-100 text-violet-700',
  qualified: 'bg-amber-100 text-amber-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
};
