import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: true });

/**
 * Renders Markdown (lead notes) to HTML. Single-user, trusted input — no
 * sanitization layer in Phase 1. Add sanitize-html here if untrusted content
 * is ever rendered (e.g. inbound mail bodies).
 */
export function renderMarkdown(md: string | null | undefined): string {
  if (!md) return '';
  return marked.parse(md, { async: false });
}
