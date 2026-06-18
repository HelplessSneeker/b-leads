const formatter = new Intl.DateTimeFormat('de-AT', {
  timeZone: 'Europe/Vienna',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/**
 * Formats a date as `dd.MM.yyyy HH:mm` in the Europe/Vienna timezone.
 * Returns an empty string for null/undefined.
 */
export function formatDateTime(value: Date | number | null | undefined): string {
  if (value == null) return '';
  const date = typeof value === 'number' ? new Date(value) : value;
  // de-AT renders "dd.MM.yyyy, HH:mm" — drop the comma for the desired format.
  return formatter.format(date).replace(',', '');
}

const dateFormatter = new Intl.DateTimeFormat('de-AT', {
  timeZone: 'Europe/Vienna',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

/**
 * Formats a date as `dd.MM.yyyy` (no time) in the Europe/Vienna timezone.
 * Returns an empty string for null/undefined.
 */
export function formatDate(value: Date | number | null | undefined): string {
  if (value == null) return '';
  const date = typeof value === 'number' ? new Date(value) : value;
  return dateFormatter.format(date);
}

/** Calendar day (YYYY-MM-DD) in the Europe/Vienna timezone. */
export function isoDateVienna(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Vienna' }).format(d);
}

/**
 * Start of tomorrow's Vienna calendar day, as a UTC Date — the exclusive upper
 * bound for "due up to and including today". This is exact without any DST/offset
 * math because followUpAt is always stored as UTC midnight of a calendar day
 * (it comes from an `<input type="date">`): a follow-up dated today
 * (`today T00:00Z`) is strictly below this bound, one dated tomorrow is not.
 */
export function startOfTomorrowVienna(now: Date): Date {
  const tomorrowIso = isoDateVienna(new Date(now.getTime() + 24 * 60 * 60 * 1000));
  return new Date(`${tomorrowIso}T00:00:00.000Z`);
}
