import Link from 'next/link';
import { Plus, ArrowUpRight, Users, ListChecks, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getDashboardSummary, getRecentActivities } from '@/lib/supabase/queries';
import { ListToolbar, PrimaryAction } from './_components/list-toolbar';
import { KpiStrip } from './_components/kpi-strip';
import { EmptyState } from './_components/empty-state';

export default async function AdminHome() {
  const [summary, recent] = await Promise.all([
    getDashboardSummary(),
    getRecentActivities(8),
  ]);

  return (
    <div className="space-y-6">
      <ListToolbar
        title="Overview"
        description="Snapshot of program activity across all sub-projects."
        actions={
          <Link href="/admin/activities/new">
            <PrimaryAction>
              <Plus className="size-4" /> Add activity
            </PrimaryAction>
          </Link>
        }
      />

      <KpiStrip
        cells={[
          {
            label: 'Participants',
            value: summary.total_participants ?? 0,
            icon: Users,
          },
          {
            label: 'Activities',
            value: summary.activity_count ?? 0,
            icon: ListChecks,
          },
          {
            label: 'Locations',
            value: summary.location_count ?? 0,
            icon: MapPin,
          },
        ]}
      />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-sm font-medium text-foreground">Recent activities</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Last {recent.length} {recent.length === 1 ? 'entry' : 'entries'}
            </p>
          </div>
          <Link
            href="/admin/activities"
            className="text-xs text-foreground hover:text-primary inline-flex items-center gap-1 font-medium transition-colors"
          >
            View all <ArrowUpRight className="size-3" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="No activities yet"
            description="Add your first activity entry to populate the dashboard."
            action={
              <Link href="/admin/activities/new">
                <PrimaryAction>
                  <Plus className="size-4" /> Add activity
                </PrimaryAction>
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-border">
            {recent.map((a) => (
              <Link
                key={a.id}
                href={`/admin/activities/${a.id}`}
                className="flex items-center gap-4 px-5 py-3 hover:bg-muted/40 transition-colors"
              >
                <div className="w-24 shrink-0 text-xs text-muted-foreground tabular-nums">
                  {a.activity_date ?? a.month_label ?? '—'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="muted">{a.sub_project?.name ?? '—'}</Badge>
                    <span className="text-sm text-foreground truncate">
                      {a.location?.name ?? 'No location'}
                    </span>
                  </div>
                  {a.notes && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">{a.notes}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold tabular-nums text-foreground">
                    {a.total_count?.toLocaleString() ?? '—'}
                  </div>
                  <div className="text-[11px] text-muted-foreground">participants</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
