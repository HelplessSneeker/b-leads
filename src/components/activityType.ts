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

// Badge colors per type. Keep these as complete literal strings so the Tailwind v4
// JIT scanner picks them up (no dynamic concatenation), same as STATUS_CLASSES.
export const ACTIVITY_TYPE_CLASSES: Record<ActivityType, string> = {
  email_sent: 'bg-blue-100 text-blue-700',
  email_received: 'bg-sky-100 text-sky-700',
  linkedin_sent: 'bg-indigo-100 text-indigo-700',
  linkedin_received: 'bg-violet-100 text-violet-700',
  call: 'bg-green-100 text-green-700',
  meeting: 'bg-amber-100 text-amber-700',
  note: 'bg-gray-100 text-gray-700',
};
