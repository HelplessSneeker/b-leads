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
    `rounded px-3 py-1 text-sm font-medium ${
      active ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
        className={`w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-500 focus:outline-none ${
          mode === 'preview' ? 'hidden' : ''
        }`}
      />

      {mode === 'preview' && (
        <div
          className="prose prose-sm max-w-none rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
          // Trusted single-user input (see src/lib/markdown.ts).
          // biome-ignore lint/security/noDangerouslySetInnerHtml: rendered Markdown preview.
          dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
        />
      )}
    </div>
  );
}
