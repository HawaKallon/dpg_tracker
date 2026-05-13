import { RichText } from '@/components/editor/rich-text';
import type { RichTextDoc } from '@/types/database';

export function NarrativeBlock({
  title,
  funderName,
  description,
}: {
  title: string;
  funderName?: string | null;
  description: RichTextDoc | null;
}) {
  if (!description) return null;
  return (
    <article className="rounded-2xl border border-border bg-card p-6 sm:p-8 print:break-inside-avoid">
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="font-serif text-2xl text-ink leading-tight">{title}</h3>
        {funderName && (
          <span className="text-eyebrow text-muted-foreground">
            Funded by {funderName}
          </span>
        )}
      </header>
      <RichText json={description} />
    </article>
  );
}
