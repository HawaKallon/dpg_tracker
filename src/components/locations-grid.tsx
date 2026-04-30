import { GraduationCap, MapPin, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { LocationBreakdown } from '@/lib/supabase/queries';

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

export function LocationsGrid({ data }: { data: LocationBreakdown[] }) {
  const max = Math.max(1, ...data.map((d) => d.total_participants));

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No locations recorded yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((loc) => {
        const Icon = TYPE_ICON[loc.type as keyof typeof TYPE_ICON] ?? MapPin;
        const pct = (loc.total_participants / max) * 100;
        const femalePct =
          loc.total_participants > 0
            ? Math.round((loc.female / loc.total_participants) * 100)
            : 0;

        return (
          <Card key={loc.id} className="overflow-hidden">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <div className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary-deep">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold leading-tight text-accent truncate">
                      {loc.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {TYPE_LABEL[loc.type as keyof typeof TYPE_LABEL] ?? 'Venue'} ·{' '}
                      {loc.activity_count} {loc.activity_count === 1 ? 'event' : 'events'}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-semibold tabular-nums leading-none text-accent">
                    {loc.total_participants.toLocaleString()}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">
                    participants
                  </div>
                </div>
              </div>

              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex gap-3">
                  <span className="text-muted-foreground">
                    M <span className="font-medium text-accent tabular-nums">{loc.male}</span>
                  </span>
                  <span className="text-muted-foreground">
                    F <span className="font-medium text-pink tabular-nums">{loc.female}</span>
                  </span>
                </div>
                <span className="text-muted-foreground">{femalePct}% female</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
