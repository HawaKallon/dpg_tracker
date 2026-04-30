import Link from 'next/link';
import { Plus, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KpiCard } from '@/components/kpi-card';
import { getDashboardSummary, getRecentActivities } from '@/lib/supabase/queries';

export default async function AdminHome() {
  const [summary, recent] = await Promise.all([
    getDashboardSummary(),
    getRecentActivities(8),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Overview
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-accent mt-1">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Snapshot of program activity across all sub-projects.
          </p>
        </div>
        <Link href="/admin/activities/new">
          <Button>
            <Plus className="size-4" /> Add activity
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Participants" value={summary.total_participants} />
        <KpiCard label="Activities" value={summary.activity_count} />
        <KpiCard label="Reach" value={summary.total_reach} />
        <KpiCard label="Locations" value={summary.location_count} />
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold text-accent">Recent activities</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Last {recent.length} entries</p>
          </div>
          <Link
            href="/admin/activities"
            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
          >
            View all <ArrowUpRight className="size-3" />
          </Link>
        </div>
        <div className="divide-y divide-border">
          {recent.length === 0 && (
            <p className="px-5 py-10 text-sm text-center text-muted-foreground">No activities yet.</p>
          )}
          {recent.map((a) => (
            <Link
              key={a.id}
              href={`/admin/activities/${a.id}`}
              className="flex items-center gap-4 px-5 py-3 hover:bg-muted/50 transition-colors"
            >
              <div className="w-24 shrink-0 text-xs text-muted-foreground tabular-nums">
                {a.activity_date ?? a.month_label ?? '—'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="muted">{a.sub_project?.name ?? '—'}</Badge>
                  <span className="text-sm text-accent truncate">
                    {a.location?.name ?? 'No location'}
                  </span>
                </div>
                {a.notes && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">{a.notes}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-semibold tabular-nums text-accent">
                  {a.total_count?.toLocaleString() ?? '—'}
                </div>
                <div className="text-[11px] text-muted-foreground">participants</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
