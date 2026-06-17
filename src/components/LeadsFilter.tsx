import { useEffect, useRef, useState } from 'react';
import { LEAD_STATUSES, type LeadStatus } from '~/db/schema';
import { STATUS_CLASSES, STATUS_LABELS } from './leadStatus';

export interface LeadsFilterProps {
  selected: LeadStatus[];
  query: string;
}

// Filter island for the leads list. The URL query is the single source of truth:
// toggling a status pill or typing in the search box rewrites `?status=…&q=…` and
// navigates, so the server re-renders the filtered table (no client-side filtering).
export default function LeadsFilter({ selected, query }: LeadsFilterProps) {
  const [active, setActive] = useState<Set<LeadStatus>>(new Set(selected));
  const [q, setQ] = useState(query);
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function navigate(nextStatuses: Set<LeadStatus>, nextQuery: string) {
    const params = new URLSearchParams();
    if (nextStatuses.size) params.set('status', [...nextStatuses].join(','));
    if (nextQuery.trim()) params.set('q', nextQuery.trim());
    const search = params.toString();
    window.location.assign(search ? `/leads?${search}` : '/leads');
  }

  function toggleStatus(status: LeadStatus) {
    const next = new Set(active);
    if (next.has(status)) next.delete(status);
    else next.add(status);
    setActive(next);
    navigate(next, q);
  }

  function onQueryChange(next: string) {
    setQ(next);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => navigate(active, next), 300);
  }

  // Clear any pending debounce on unmount.
  useEffect(() => () => clearTimeout(debounce.current), []);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="search"
        value={q}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (debounce.current) clearTimeout(debounce.current);
            navigate(active, q);
          }
        }}
        placeholder="Suche Name, E-Mail, Firma…"
        className="rounded border border-gray-300 px-3 py-1.5 text-sm"
      />
      <div className="flex flex-wrap gap-2">
        {LEAD_STATUSES.map((s) => {
          const isActive = active.has(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggleStatus(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                isActive ? STATUS_CLASSES[s] : 'bg-white text-gray-500 ring-1 ring-gray-300'
              }`}
              aria-pressed={isActive}
            >
              {STATUS_LABELS[s]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
