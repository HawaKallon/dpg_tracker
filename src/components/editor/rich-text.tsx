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
        'prose prose-sm max-w-none prose-headings:text-accent prose-a:text-primary prose-strong:text-accent',
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
