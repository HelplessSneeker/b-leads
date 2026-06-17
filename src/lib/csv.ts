import Papa from 'papaparse';

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
}

/**
 * Parses a CSV string into headers + row objects (keyed by header).
 * Used by /leads/import to preview columns before mapping them to lead fields.
 * Detects the delimiter automatically and handles quoted fields.
 */
export function parseCsv(content: string): ParsedCsv {
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  const headers = result.meta.fields ?? [];
  return { headers, rows: result.data };
}

/** Lead fields that an imported CSV column can be mapped to. */
export const IMPORTABLE_LEAD_FIELDS = [
  'name',
  'email',
  'company',
  'role',
  'source',
  'nextAction',
  'notes',
] as const;
export type ImportableLeadField = (typeof IMPORTABLE_LEAD_FIELDS)[number];

/** Maps CSV header -> lead field (e.g. { "E-Mail": "email" }). */
export type ColumnMapping = Partial<Record<string, ImportableLeadField>>;
