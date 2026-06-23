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

// Timeline node-dot color per type. Pairs with the `.act-dot-*` classes in
// global.css, which fill with the saturated activity-hue (`-fg` token) so the dot
// reads clearly on the page surface — unlike ACTIVITY_TYPE_CLASSES above, whose
// pale chip background is too faint for a small dot. Same hue vocabulary, kept
// clear of the 245° interaction accent.
export const ACTIVITY_DOT_CLASSES: Record<ActivityType, string> = {
  email_sent: 'act-dot-email_sent',
  email_received: 'act-dot-email_received',
  linkedin_sent: 'act-dot-linkedin_sent',
  linkedin_received: 'act-dot-linkedin_received',
  call: 'act-dot-call',
  meeting: 'act-dot-meeting',
  note: 'act-dot-note',
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
