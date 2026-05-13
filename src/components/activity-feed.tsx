import Link from 'next/link';
import Image from 'next/image';
import { Calendar, ExternalLink, MapPin } from 'lucide-react';
import type { ActivityWithRelations } from '@/types/database';

function formatDate(s: string | null, fallback: string | null): string {
  if (!s) return fallback ?? '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function ActivityFeed({ items }: { items: ActivityWithRelations[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 py-10 text-center text-sm text-muted-foreground">
        No activities for this year yet.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border border border-border rounded-2xl bg-card overflow-hidden shadow-card">
      {items.map((a) => {
        const female = a.female_count ?? 0;
        const male = a.male_count ?? 0;
        const total = a.total_count ?? male + female;
        const monthShort = a.activity_date
          ? new Date(a.activity_date).toLocaleDateString(undefined, { month: 'short' })
          : a.month_label?.slice(0, 3) ?? '—';
        const dayNum = a.activity_date
          ? new Date(a.activity_date).getDate()
          : null;
        const thumb = a.media_urls?.[0];

        return (
          <li key={a.id} className="px-4 py-4 sm:px-6 sm:py-5 hover:bg-paper/60 transition-colors">
            <Link
              href={`/activities/${a.id}`}
              className="flex flex-wrap items-start gap-4 sm:gap-5 group focus-visible:outline-none"
            >
              <div className="flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl border border-border bg-background text-ink shrink-0">
                <span className="text-eyebrow text-muted-foreground">{monthShort}</span>
                {dayNum !== null ? (
                  <span className="font-serif text-2xl leading-none tabular-nums">{dayNum}</span>
                ) : (
                  <Calendar className="size-4 mt-1" aria-hidden="true" />
                )}
              </div>

              {thumb && (
                <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-background">
                  <Image
                    src={thumb}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1.5 text-eyebrow text-muted-foreground">
                  {a.sub_project?.name && <span className="text-accent">{a.sub_project.name}</span>}
                  {a.category?.name && <span aria-hidden="true">·</span>}
                  {a.category?.name && <span>{a.category.name}</span>}
                </div>
                <h3 className="font-serif text-xl sm:text-2xl leading-tight text-ink group-hover:text-accent transition-colors">
                  {a.sub_category?.name ?? a.category?.name ?? a.sub_project?.name ?? 'Activity'}
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3" />
                    {a.location?.name ?? 'Location not set'}
                  </span>
                  <span>{formatDate(a.activity_date, a.month_label)}</span>
                  {a.data_source && <span>· {a.data_source}</span>}
                </div>
              </div>

              <div className="flex items-center gap-5 sm:gap-6 shrink-0 ml-auto">
                <div className="text-right">
                  <div className="font-serif text-3xl sm:text-4xl tabular-nums leading-none text-ink">
                    {total.toLocaleString()}
                  </div>
                  <div className="text-eyebrow text-muted-foreground mt-1">
                    participants
                  </div>
                </div>
                <div className="hidden sm:flex flex-col gap-0.5 text-xs min-w-[64px]">
                  <span className="text-muted-foreground">
                    M{' '}
                    <span className="font-medium text-signal tabular-nums">{male}</span>
                  </span>
                  <span className="text-muted-foreground">
                    F{' '}
                    <span className="font-medium text-accent tabular-nums">{female}</span>
                  </span>
                </div>
                {a.discourse_url && (
                  <span
                    aria-label="External discussion"
                    className="hidden sm:inline-flex items-center text-muted-foreground"
                  >
                    <ExternalLink className="size-3.5" />
                  </span>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
