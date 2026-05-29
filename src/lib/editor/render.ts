import 'server-only';
import { generateHTML } from '@tiptap/html';
import type { JSONContent } from '@tiptap/core';
import { getRenderExtensions } from '@/lib/editor/extensions';

/**
 * Convert Tiptap JSON to HTML on the server.
 * Returns '' for null/empty docs so callers can branch (or render unconditionally).
 */
export function renderRichText(json: JSONContent | null | undefined): string {
  if (!json || typeof json !== 'object') return '';
  const content = (json as { content?: unknown[] }).content;
  if (!Array.isArray(content) || content.length === 0) return '';
  return generateHTML(json, getRenderExtensions());
}
