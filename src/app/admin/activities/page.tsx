import Link from 'next/link';
import { Plus, Trash2, Pencil, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getAllActivities } from '@/lib/supabase/queries';
import { deleteActivity } from './actions';
import { ListToolbar, PrimaryAction } from '../_components/list-toolbar';
import { EmptyState } from '../_components/empty-state';

export default async function ActivitiesPage() {
  const rows = await getAllActivities();

  return (
    <div className="space-y-6">
      <ListToolbar
        title="Activities"
        count={rows.length}
        description="Every recorded activity across all sub-projects."
        actions={
          <Link href="/admin/activities/new">
            <PrimaryAction>
              <Plus className="size-4" /> Add activity
            </PrimaryAction>
          </Link>
        }
      />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="No activities yet"
            description="Create your first activity to start tracking participants."
            action={
              <Link href="/admin/activities/new">
                <PrimaryAction>
                  <Plus className="size-4" /> Add activity
                </PrimaryAction>
              </Link>
            }
          />
        ) : (
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
                <TH className="w-[1%]" />
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
                  <TD className="text-foreground">{a.location?.name ?? '—'}</TD>
                  <TD className="text-right tabular-nums">{a.male_count ?? '—'}</TD>
                  <TD className="text-right tabular-nums">{a.female_count ?? '—'}</TD>
                  <TD className="text-right tabular-nums font-semibold text-foreground">
                    {a.total_count ?? '—'}
                  </TD>
                  <TD className="whitespace-nowrap">
                    <div className="flex items-center justify-end gap-0.5">
                      <Link href={`/admin/activities/${a.id}`}>
                        <Button variant="ghost" size="sm" aria-label="Edit">
                          <Pencil className="size-4" />
                        </Button>
                      </Link>
                      <form action={deleteActivity}>
                        <input type="hidden" name="id" value={a.id} />
                        <Button type="submit" variant="ghost" size="sm" aria-label="Delete">
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </form>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </div>
    </div>
  );
}
