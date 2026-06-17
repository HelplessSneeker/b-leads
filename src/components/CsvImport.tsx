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
type ImportResult = { inserted: number; duplicates: number; skipped: number };

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

const inputClass =
  'rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-500 focus:outline-none';

// Auto-map a lead field to a CSV header when their names match (case-insensitive).
function autoMap(headers: string[]): Mapping {
  const mapping: Mapping = {};
  for (const field of IMPORTABLE_LEAD_FIELDS) {
    const match = headers.find((h) => h.toLowerCase() === field.toLowerCase());
    if (match) mapping[field] = match;
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

  function onFile(file: File) {
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const { headers, rows } = parseCsv(String(reader.result ?? ''));
      setFileName(file.name);
      setHeaders(headers);
      setRows(rows);
      setMapping(autoMap(headers));
    };
    reader.onerror = () => setError('Datei konnte nicht gelesen werden.');
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

  const canImport = rows.length > 0 && defaultSource.trim().length > 0 && !importing;

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
      setResult({ inserted: data.inserted, duplicates: data.duplicates, skipped });
    } catch {
      setError('Import fehlgeschlagen.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="csv-file">
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
          className="mt-1 block text-sm text-gray-600 file:mr-3 file:rounded file:border-0 file:bg-gray-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-gray-700"
        />
        {fileName && (
          <p className="mt-1 text-sm text-gray-500">
            {fileName} — {rows.length} Zeilen, {headers.length} Spalten
          </p>
        )}
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <p className="font-medium">Import abgeschlossen.</p>
          <p className="mt-1">
            {result.inserted} importiert · {result.duplicates} Duplikate · {result.skipped}{' '}
            übersprungen (ohne Name/E-Mail).
          </p>
          <a href="/leads" className="mt-2 inline-block font-medium underline hover:text-green-900">
            → zur Lead-Liste
          </a>
        </div>
      )}

      {rows.length > 0 && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="default-source">
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
            <h2 className="text-sm font-medium text-gray-700">Spalten-Zuordnung</h2>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {IMPORTABLE_LEAD_FIELDS.map((field) => (
                <div key={field} className="flex items-center gap-2">
                  <span className="w-28 shrink-0 text-sm text-gray-600">
                    {FIELD_LABELS[field]}
                    {REQUIRED_FIELDS.includes(field) && <span className="text-red-500"> *</span>}
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
            <h2 className="text-sm font-medium text-gray-700">Vorschau (erste 5 Zeilen)</h2>
            <div className="mt-2 overflow-x-auto rounded border border-gray-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    {headers.map((h) => (
                      <th key={h} className="px-3 py-2 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((row, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: preview rows are static.
                    <tr key={i} className="border-b border-gray-100 last:border-0">
                      {headers.map((h) => (
                        <td key={h} className="px-3 py-2 text-gray-600">
                          {row[h]}
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
              className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {importing ? 'Importiere…' : `${payload.length} Leads importieren`}
            </button>
            <span className="text-sm text-gray-500">
              {skipped > 0 && `${skipped} Zeilen werden übersprungen (ohne Name/E-Mail)`}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
