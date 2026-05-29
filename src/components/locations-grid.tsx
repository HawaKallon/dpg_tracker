import Link from 'next/link';
import { ArrowUpRight, GraduationCap, MapPin, Users } from 'lucide-react';
import type { LocationBreakdown } from '@/lib/supabase/queries';
import { cn } from '@/lib/utils/cn';

const TYPE_ICON = {
  university: GraduationCap,
  hub: MapPin,
  online: Users,
  other: MapPin,
} as const;

const TYPE_LABEL = {
  university: 'University',
  hub: 'Hub',
  online: 'Online',
  other: 'Venue',
} as const;

export function LocationsGrid({
  data,
  year,
}: {
  data: LocationBreakdown[];
  year?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.total_participants));

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 py-10 text-center text-sm text-muted-foreground">
        No locations recorded yet.
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {data.map((loc) => {
        const Icon = TYPE_ICON[loc.type as keyof typeof TYPE_ICON] ?? MapPin;
        const pct = (loc.total_participants / max) * 100;
        const femalePct =
          loc.total_participants > 0
            ? Math.round((loc.female / loc.total_participants) * 100)
            : 0;

        const inner = (
          <article
            className={cn(
              'group rounded-2xl border border-border bg-card p-5 shadow-card transition-all',
              'hover:border-accent/60 hover:-translate-y-0.5 hover:shadow-lift'
            )}
          >
            <header className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-start gap-3 min-w-0">
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-paper text-ink">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold leading-tight text-ink truncate group-hover:text-accent transition-colors">
                    {loc.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {TYPE_LABEL[loc.type as keyof typeof TYPE_LABEL] ?? 'Venue'} ·{' '}
                    {loc.activity_count} {loc.activity_count === 1 ? 'event' : 'events'}
                  </p>
                </div>
              </div>
              <ArrowUpRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-accent transition-all shrink-0" />
            </header>

            <div className="font-serif text-3xl sm:text-4xl tabular-nums leading-none text-ink">
              {loc.total_participants.toLocaleString()}
            </div>
            <div className="text-eyebrow text-muted-foreground mt-1.5">
              participants
            </div>

            <div className="mt-4 h-px w-full bg-border relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 h-px bg-accent"
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs mt-3">
              <div className="flex gap-3">
                <span className="text-muted-foreground">
                  M{' '}
                  <span className="font-medium text-signal tabular-nums">
                    {loc.male.toLocaleString()}
                  </span>
                </span>
                <span className="text-muted-foreground">
                  F{' '}
                  <span className="font-medium text-accent tabular-nums">
                    {loc.female.toLocaleString()}
                  </span>
                </span>
              </div>
              <span className="text-muted-foreground tabular-nums">
                {femalePct}% female
              </span>
            </div>
          </article>
        );

        if (!loc.slug) {
          return (
            <div key={loc.id}>
              {inner}
            </div>
          );
        }

        return (
          <Link
            key={loc.id}
            href={{
              pathname: `/locations/${loc.slug}`,
              query: year ? { year: String(year) } : undefined,
            }}
            className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-2xl"
            aria-label={`View ${loc.name} details`}
          >
            {inner}
          </Link>
        );
      })}
    </div>
  );
}
