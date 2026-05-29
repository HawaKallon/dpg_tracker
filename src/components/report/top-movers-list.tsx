import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { TopMoverRow } from '@/lib/supabase/queries';

export function TopMoversList({
  title,
  movers,
  hrefBase,
  emptyLabel = 'No data',
}: {
  title: string;
  movers: TopMoverRow[];
  hrefBase: '/programs' | '/locations';
  emptyLabel?: string;
}) {
  if (movers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/60 p-6 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="border-b border-border px-5 py-3">
        <span className="text-eyebrow text-muted-foreground">{title}</span>
      </div>
      <ul className="divide-y divide-border">
        {movers.map((m) => {
          const isNew = m.delta_pct === null;
          const Icon = isNew
            ? Sparkles
            : (m.delta_pct ?? 0) >= 0
              ? ArrowUpRight
              : ArrowDownRight;
          const tone = isNew
            ? 'text-accent'
            : (m.delta_pct ?? 0) >= 0
              ? 'text-success'
              : 'text-accent';
          const deltaLabel = isNew
            ? 'new'
            : `${(m.delta_pct ?? 0) > 0 ? '+' : ''}${m.delta_pct}%`;

          return (
            <li key={m.id} className="flex items-center gap-3 px-5 py-3 text-sm">
              <Link
                href={`${hrefBase}/${m.slug}`}
                className="flex-1 font-medium text-ink hover:text-accent transition-colors min-w-0 truncate"
              >
                {m.name}
              </Link>
              <span className="tabular-nums font-serif text-base text-ink">
                {m.current_value.toLocaleString()}
              </span>
              <span className={cn('inline-flex items-center gap-1 text-xs font-medium', tone)}>
                <Icon className="size-3.5" aria-hidden="true" />
                {deltaLabel}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
