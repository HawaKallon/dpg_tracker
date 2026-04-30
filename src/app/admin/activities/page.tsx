import Link from 'next/link';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getAllActivities } from '@/lib/supabase/queries';
import { deleteActivity } from './actions';

export default async function ActivitiesPage() {
  const rows = await getAllActivities();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Records
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-accent mt-1">Activities</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {rows.length.toLocaleString()} total entries across all sub-projects.
          </p>
        </div>
        <Link href="/admin/activities/new">
          <Button>
            <Plus className="size-4" /> Add activity
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <THead>
            <TR>
              <TH>Year</TH>
              <TH>Date</TH>
              <TH>Sub-project</TH>
              <TH>Category</TH>
              <TH>Location</TH>
              <TH className="text-right">M</TH>
              <TH className="text-right">F</TH>
              <TH className="text-right">Total</TH>
              <TH></TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((a) => (
              <TR key={a.id}>
                <TD className="text-muted-foreground tabular-nums">{a.event_year}</TD>
                <TD className="whitespace-nowrap text-muted-foreground">
                  {a.activity_date ?? a.month_label ?? '—'}
                </TD>
                <TD>
                  <Badge variant="muted">{a.sub_project?.name ?? '—'}</Badge>
                </TD>
                <TD className="text-muted-foreground">{a.category?.name ?? '—'}</TD>
                <TD>{a.location?.name ?? '—'}</TD>
                <TD className="text-right tabular-nums">{a.male_count ?? '—'}</TD>
                <TD className="text-right tabular-nums">{a.female_count ?? '—'}</TD>
                <TD className="text-right tabular-nums font-semibold text-accent">
                  {a.total_count ?? '—'}
                </TD>
                <TD className="text-right whitespace-nowrap">
                  <Link href={`/admin/activities/${a.id}`} className="inline-block mr-1">
                    <Button variant="ghost" size="sm" aria-label="Edit">
                      <Pencil className="size-4" />
                    </Button>
                  </Link>
                  <form action={deleteActivity} className="inline-block">
                    <input type="hidden" name="id" value={a.id} />
                    <Button type="submit" variant="ghost" size="sm" aria-label="Delete">
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </form>
                </TD>
              </TR>
            ))}
            {rows.length === 0 && (
              <TR>
                <TD colSpan={9} className="text-center text-muted-foreground py-12">
                  No activities yet.
                </TD>
              </TR>
            )}
          </TBody>
        </Table>
      </div>
    </div>
  );
}
