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
