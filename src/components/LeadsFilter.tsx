import { useState } from 'react';
import { LEAD_STATUSES, type LeadStatus } from '~/db/schema';

// React island placeholder for the leads table filter/search (Phase 1).
// The real implementation will filter the rendered table by status + query.

export interface LeadsFilterProps {
  onChange?: (filter: { query: string; status: LeadStatus | 'all' }) => void;
}

export default function LeadsFilter({ onChange }: LeadsFilterProps) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<LeadStatus | 'all'>('all');

  function update(next: { query?: string; status?: LeadStatus | 'all' }) {
    const merged = { query, status, ...next };
    setQuery(merged.query);
    setStatus(merged.status);
    onChange?.(merged);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="search"
        value={query}
        onChange={(e) => update({ query: e.target.value })}
        placeholder="Suche Name, E-Mail, Firma…"
        className="rounded border border-gray-300 px-3 py-1.5 text-sm"
      />
      <select
        value={status}
        onChange={(e) => update({ status: e.target.value as LeadStatus | 'all' })}
        className="rounded border border-gray-300 px-3 py-1.5 text-sm"
      >
        <option value="all">Alle Status</option>
        {LEAD_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {/* TODO(Phase 1): apply filter to the table (client-side or via fetch). */}
    </div>
  );
}
