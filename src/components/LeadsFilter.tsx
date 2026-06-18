import { useEffect, useRef, useState } from 'react';
import type { LeadStatus } from '~/db/schema';

export interface LeadsFilterProps {
  selected: LeadStatus[];
  query: string;
}

// Search box for the leads list. The URL query is the single source of truth:
// typing rewrites `?status=…&q=…` and navigates, so the server re-renders the
// filtered table (no client-side filtering). Status filtering lives in the stat
// row above — the one canonical place to toggle a status — so this island only
// owns the text query and carries the active statuses through unchanged.
export default function LeadsFilter({ selected, query }: LeadsFilterProps) {
  const [q, setQ] = useState(query);
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function navigate(nextQuery: string) {
    const params = new URLSearchParams();
    if (selected.length) params.set('status', selected.join(','));
    if (nextQuery.trim()) params.set('q', nextQuery.trim());
    const search = params.toString();
    window.location.assign(search ? `/leads?${search}` : '/leads');
  }

  function onQueryChange(next: string) {
    setQ(next);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => navigate(next), 300);
  }

  // Clear any pending debounce on unmount.
  useEffect(() => () => clearTimeout(debounce.current), []);

  return (
    <input
      type="search"
      value={q}
      onChange={(e) => onQueryChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          if (debounce.current) clearTimeout(debounce.current);
          navigate(q);
        }
      }}
      placeholder="Suche Name, E-Mail, Firma…"
      className="w-64 rounded-sm border border-border bg-bg px-2.5 py-1.5 text-sm text-ink transition-colors placeholder:text-muted focus:border-accent sm:w-72"
    />
  );
}
