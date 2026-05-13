import type { JSONContent } from '@tiptap/core';
import { renderRichText } from '@/lib/editor/render';
import type { RichTextDoc } from '@/types/database';
import { cn } from '@/lib/utils/cn';

export function RichText({
  json,
  className,
}: {
  json: RichTextDoc | null;
  className?: string;
}) {
  const html = renderRichText(json as JSONContent | null);
  if (!html) return null;
  return (
    <div
      className={cn(
        'prose max-w-none',
        'prose-headings:font-sans prose-headings:text-ink prose-headings:font-semibold prose-headings:tracking-tight',
        'prose-p:font-serif prose-p:text-foreground prose-p:leading-relaxed',
        'prose-strong:text-ink prose-strong:font-semibold',
        'prose-a:text-accent prose-a:no-underline hover:prose-a:underline',
        'prose-blockquote:font-serif prose-blockquote:italic prose-blockquote:border-accent prose-blockquote:text-ink',
        'prose-li:font-serif prose-li:text-foreground',
        'prose-code:text-accent-deep prose-code:bg-paper prose-code:px-1 prose-code:py-0.5 prose-code:rounded',
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
