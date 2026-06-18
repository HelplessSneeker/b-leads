import { actions } from 'astro:actions';
import { useMemo, useState } from 'react';
import { IMPORTABLE_LEAD_FIELDS, type ImportableLeadField, parseCsv } from '~/lib/csv';

// German labels for the mappable lead fields (English keys match the DB columns).
const FIELD_LABELS: Record<ImportableLeadField, string> = {
  name: 'Name',
  email: 'E-Mail',
  company: 'Firma',
  role: 'Rolle',
  source: 'Quelle',
  nextAction: 'Next Action',
  notes: 'Notizen',
};

// Fields that need a mapped value for a row to be importable. source is filled from
// the default-source input when unmapped, so it is not in this list.
const REQUIRED_FIELDS: ImportableLeadField[] = ['name', 'email'];

type Mapping = Partial<Record<ImportableLeadField, string>>;
type ImportResult = {
  inserted: number;
  duplicates: number;
  invalid: number;
  skipped: number;
};

// Guard against accidentally loading a huge non-CSV file into the tab (reading it
// as text would freeze the page). Generous for a leads export.
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

// Ready-to-insert lead row sent to the importLeads action (matches its Zod input).
type ImportRow = {
  name: string;
  email: string;
  source: string;
  company?: string;
  role?: string;
  nextAction?: string;
  notes?: string;
};

const inputClass = 'field';

// Normalize a header/alias for matching: lowercase, strip diacritics + any
// non-alphanumeric chars. So "E-Mail" -> "email", "Nächste Aktion" -> "nachsteaktion".
function normalizeHeader(s: string): string {
  // NFKD splits accented letters into base + combining mark; [^a-z0-9] then drops
  // the marks and every other separator, so only base alphanumerics remain.
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]/g, '');
}

// Common German/English header spellings per field (normalized on use). The field
// key and its German label are also accepted automatically.
const FIELD_ALIASES: Record<ImportableLeadField, string[]> = {
  name: ['name', 'kontakt', 'fullname', 'vollername'],
  email: ['email', 'mail', 'emailadresse', 'emailaddress', 'mailadresse'],
  company: ['company', 'firma', 'unternehmen', 'organization', 'organisation'],
  role: ['role', 'rolle', 'position', 'titel', 'title', 'funktion'],
  source: ['source', 'quelle', 'herkunft', 'kanal'],
  nextAction: ['nextaction', 'nachsteaktion', 'naechsteaktion', 'nextstep', 'todo', 'aktion'],
  notes: ['notes', 'notizen', 'notiz', 'anmerkungen', 'kommentar', 'kommentare', 'bemerkung'],
};

// Auto-map each lead field to a CSV header whose name matches the field key, its
// German label, or a known alias (diacritic-/punctuation-insensitive).
function autoMap(headers: string[]): Mapping {
  const mapping: Mapping = {};
  const used = new Set<string>();
  for (const field of IMPORTABLE_LEAD_FIELDS) {
    const candidates = new Set(
      [field, FIELD_LABELS[field], ...FIELD_ALIASES[field]].map(normalizeHeader),
    );
    const match = headers.find((h) => !used.has(h) && candidates.has(normalizeHeader(h)));
    if (match) {
      mapping[field] = match;
      used.add(match);
    }
  }
  return mapping;
}

export default function CsvImport() {
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Mapping>({});
  const [defaultSource, setDefaultSource] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  // Reset any previously loaded file so a failed/empty load can't be imported.
  function clearFile() {
    setFileName('');
    setHeaders([]);
    setRows([]);
    setMapping({});
  }

  function onFile(file: File) {
    setResult(null);
    setError(null);
    if (file.size > MAX_FILE_BYTES) {
      clearFile();
      setError('Datei ist zu groß (max. 10 MB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const { headers, rows, errors } = parseCsv(String(reader.result ?? ''));
      setFileName(file.name);
      if (headers.length === 0) {
        clearFile();
        setError('Keine Spalten erkannt — ist das eine gültige CSV-Datei?');
        return;
      }
      setHeaders(headers);
      setRows(rows);
      setMapping(autoMap(headers));
      if (rows.length === 0) {
        setError('Datei enthält keine Datenzeilen.');
      } else if (errors.length > 0) {
        setError(`CSV teilweise fehlerhaft gelesen: ${errors[0]}`);
      }
    };
    reader.onerror = () => {
      clearFile();
      setError('Datei konnte nicht gelesen werden.');
    };
    reader.readAsText(file);
  }

  // Build the rows to send + count rows skipped for missing name/email.
  const { payload, skipped } = useMemo(() => {
    const payload: ImportRow[] = [];
    let skipped = 0;
    for (const row of rows) {
      const lead: Record<string, string> = {};
      for (const field of IMPORTABLE_LEAD_FIELDS) {
        const header = mapping[field];
        const v = header ? (row[header] ?? '').trim() : '';
        if (v) lead[field] = v;
      }
      if (!lead.source && defaultSource.trim()) lead.source = defaultSource.trim();
      if (!lead.email || !lead.name) {
        skipped++;
        continue;
      }
      payload.push(lead as ImportRow);
    }
    return { payload, skipped };
  }, [rows, mapping, defaultSource]);

  const canImport = payload.length > 0 && defaultSource.trim().length > 0 && !importing;

  async function onImport() {
    setError(null);
    setResult(null);
    setImporting(true);
    try {
      const { data, error } = await actions.importLeads(payload);
      if (error) {
        setError(error.message);
        return;
      }
      setResult({
        inserted: data.inserted,
        duplicates: data.duplicates,
        invalid: data.invalid,
        skipped,
      });
      // Reset the picker so the outcome (toast) is the clear end state and the
      // same file can't be re-imported by accident.
      clearFile();
    } catch {
      setError('Import fehlgeschlagen.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-ink" htmlFor="csv-file">
          CSV-Datei
        </label>
        <input
          id="csv-file"
          type="file"
          accept=".csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
          }}
          className="mt-1 block text-sm text-muted file:mr-3 file:cursor-pointer file:rounded-sm file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-accent-hover"
        />
        {fileName && (
          <p className="mt-1 text-sm text-muted">
            <span className="data text-ink">{fileName}</span> — {rows.length} Zeilen,{' '}
            {headers.length} Spalten
          </p>
        )}
      </div>

      {rows.length > 0 && (
        <>
          <div>
            <label className="block text-sm font-medium text-ink" htmlFor="default-source">
              Standard-Quelle (für Zeilen ohne gemappte Quelle)
            </label>
            <input
              id="default-source"
              type="text"
              required
              value={defaultSource}
              onChange={(e) => setDefaultSource(e.target.value)}
              placeholder="z.B. outreach-wave-2"
              className={`mt-1 ${inputClass}`}
            />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-ink">Spalten-Zuordnung</h2>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {IMPORTABLE_LEAD_FIELDS.map((field) => (
                <div key={field} className="flex items-center gap-2">
                  <span className="w-28 shrink-0 text-sm text-muted">
                    {FIELD_LABELS[field]}
                    {REQUIRED_FIELDS.includes(field) && <span className="text-danger"> *</span>}
                  </span>
                  <select
                    value={mapping[field] ?? ''}
                    onChange={(e) =>
                      setMapping((m) => ({ ...m, [field]: e.target.value || undefined }))
                    }
                    className={`flex-1 ${inputClass}`}
                  >
                    <option value="">(leer)</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-ink">Vorschau (erste 5 Zeilen)</h2>
            <div className="mt-2 overflow-x-auto rounded-sm border border-border bg-surface">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-surface-sunken text-[0.6875rem] uppercase tracking-[0.05em] text-muted">
                  <tr>
                    {headers.map((h) => (
                      <th key={h} className="px-3 py-2 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((row, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: preview rows are static.
                    <tr key={i} className="border-b border-border last:border-0">
                      {headers.map((h) => (
                        <td key={h} className="px-3 py-1.5">
                          <span className="data text-muted">{row[h]}</span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={!canImport}
              onClick={onImport}
              className="btn btn-primary"
            >
              {importing ? 'Importiere…' : `${payload.length} Leads importieren`}
            </button>
            <span className="text-sm text-muted">
              {payload.length === 0
                ? 'Keine importierbare Zeile — Name und E-Mail müssen zugeordnet sein.'
                : skipped > 0 && `${skipped} Zeilen werden übersprungen (ohne Name/E-Mail)`}
            </span>
          </div>
        </>
      )}

      {/* Fixed toast so the outcome is visible no matter how far the form is scrolled. */}
      {(result || error) && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm" role="status" aria-live="polite">
          {error ? (
            <div className="flex items-start gap-3 rounded-sm border border-danger-border bg-danger-bg p-4 text-sm text-danger shadow-[0_8px_24px_-6px_oklch(0_0_0/0.18)]">
              <span className="flex-1">{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="font-medium text-danger hover:opacity-70"
                aria-label="Schließen"
              >
                ✕
              </button>
            </div>
          ) : (
            result && (
              <div className="rounded-sm border border-success-border bg-success-bg p-4 text-sm text-success shadow-[0_8px_24px_-6px_oklch(0_0_0/0.18)]">
                <div className="flex items-start gap-3">
                  <p className="flex-1 font-semibold">Import abgeschlossen</p>
                  <button
                    type="button"
                    onClick={() => setResult(null)}
                    className="font-medium text-success hover:opacity-70"
                    aria-label="Schließen"
                  >
                    ✕
                  </button>
                </div>
                <p className="mt-1">
                  <span className="data">{result.inserted}</span> importiert ·{' '}
                  <span className="data">{result.duplicates}</span> Duplikate ·{' '}
                  <span className="data">{result.invalid}</span> ungültig ·{' '}
                  <span className="data">{result.skipped}</span> übersprungen (ohne Name/E-Mail).
                </p>
                <a href="/leads" className="mt-2 inline-block font-medium underline">
                  → zur Lead-Liste
                </a>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
