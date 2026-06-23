import type { ActivityType } from '~/db/schema';

// German display labels for the activity types (English keys in the DB).
export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  email_sent: 'E-Mail gesendet',
  email_received: 'E-Mail erhalten',
  linkedin_sent: 'LinkedIn-DM gesendet',
  linkedin_received: 'LinkedIn-DM erhalten',
  call: 'Anruf',
  meeting: 'Meeting',
  note: 'Notiz',
};

// Activity-tag color modifier per type (pairs with the `.tag` base class from
// global.css). A separate vocabulary from status hues; deliberately kept clear of
// the 245° interaction accent (linkedin sits on violet/purple, not indigo) so a
// badge can never be mistaken for an action.
export const ACTIVITY_TYPE_CLASSES: Record<ActivityType, string> = {
  email_sent: 'tag-act-email_sent',
  email_received: 'tag-act-email_received',
  linkedin_sent: 'tag-act-linkedin_sent',
  linkedin_received: 'tag-act-linkedin_received',
  call: 'tag-act-call',
  meeting: 'tag-act-meeting',
  note: 'tag-act-note',
};

// Communication direction for the timeline arrow: outbound (we reached out),
// inbound (they reached us), or none for two-way / internal entries. Muted glyph
// only — never the interaction accent.
export const ACTIVITY_DIRECTION: Record<ActivityType, 'out' | 'in' | null> = {
  email_sent: 'out',
  email_received: 'in',
  linkedin_sent: 'out',
  linkedin_received: 'in',
  call: null,
  meeting: null,
  note: null,
};
