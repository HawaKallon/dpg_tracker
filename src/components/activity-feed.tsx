import Link from 'next/link';
import { Calendar, ExternalLink, MapPin, Users2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No activities for this year yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((a) => {
        const female = a.female_count ?? 0;
        const male = a.male_count ?? 0;
        const total = a.total_count ?? male + female;
        const femalePct = total > 0 ? Math.round((female / total) * 100) : 0;

        return (
          <Card key={a.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
                <div className="flex flex-col items-center justify-center bg-primary/10 text-primary-deep rounded-lg w-14 h-14 shrink-0">
                  <Calendar className="size-4" />
                  <span className="text-[10px] mt-0.5 font-medium uppercase tracking-wide">
                    {a.activity_date
                      ? new Date(a.activity_date).toLocaleDateString(undefined, { month: 'short' })
                      : a.month_label?.slice(0, 3) ?? '—'}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {a.sub_project?.name && (
                      <Badge variant="default">{a.sub_project.name}</Badge>
                    )}
                    {a.category?.name && (
                      <span className="text-xs text-muted-foreground">{a.category.name}</span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-accent leading-snug">
                    <Link
                      href={`/activities/${a.id}`}
                      className="hover:underline focus-visible:outline-none focus-visible:underline"
                    >
                      {a.sub_category?.name ?? a.category?.name ?? a.sub_project?.name ?? 'Activity'}
                    </Link>
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3" />
                      {a.location?.name ?? 'Location not set'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="size-3" />
                      {formatDate(a.activity_date, a.month_label)}
                    </span>
                    {a.data_source && (
                      <span className="inline-flex items-center gap-1">
                        <Users2 className="size-3" />
                        {a.data_source}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-auto">
                  <div className="text-right">
                    <div className="text-2xl font-semibold tabular-nums leading-none text-accent">
                      {total.toLocaleString()}
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">
                      participants
                    </div>
                  </div>
                  <div className="hidden sm:flex flex-col gap-1 text-xs min-w-[64px]">
                    <span className="text-muted-foreground">
                      M <span className="font-medium text-primary-deep tabular-nums">{male}</span>
                    </span>
                    <span className="text-muted-foreground">
                      F <span className="font-medium text-pink tabular-nums">{female}</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground">{femalePct}% female</span>
                  </div>
                  {a.discourse_url && (
                    <a
                      href={a.discourse_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary-deep hover:underline"
                    >
                      Source <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
