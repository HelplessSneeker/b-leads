import { useState } from 'react';
import { renderMarkdown } from '~/lib/markdown';

export interface NotesEditorProps {
  value: string;
}

// Notes field with an Edit/Preview tab toggle. The <textarea name="notes"> stays
// mounted in both modes (hidden via CSS in preview) so it always submits with the
// surrounding Astro form. Preview renders Markdown client-side via renderMarkdown.
export default function NotesEditor({ value }: NotesEditorProps) {
  const [text, setText] = useState(value);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');

  const tabClass = (active: boolean) =>
    `rounded-sm px-3 py-1 text-sm font-medium transition-colors ${
      active ? 'bg-accent text-white' : 'text-muted hover:bg-surface hover:text-ink'
    }`;

  return (
    <div>
      <div className="mb-2 flex gap-2">
        <button type="button" className={tabClass(mode === 'edit')} onClick={() => setMode('edit')}>
          Bearbeiten
        </button>
        <button
          type="button"
          className={tabClass(mode === 'preview')}
          onClick={() => setMode('preview')}
        >
          Vorschau
        </button>
      </div>

      <textarea
        name="notes"
        rows={8}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className={`field ${mode === 'preview' ? 'hidden' : ''}`}
      />

      {mode === 'preview' && (
        <div
          className="notes-rendered max-w-none rounded-sm border border-border bg-surface px-3 py-2"
          // Trusted single-user input (see src/lib/markdown.ts).
          // biome-ignore lint/security/noDangerouslySetInnerHtml: rendered Markdown preview.
          dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
        />
      )}
    </div>
  );
}
