import Link from 'next/link';
import { Plus, Trash2, Pencil, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getSubProjects } from '@/lib/supabase/queries';
import { deleteSubProject } from './actions';

export default async function AdminSubProjectsPage() {
  const rows = await getSubProjects();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Records
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-accent mt-1">
            Sub-projects
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {rows.length.toLocaleString()} programs. Public pages at{' '}
            <code className="text-accent">/programs/[slug]</code>.
          </p>
        </div>
        <Link href="/admin/sub-projects/new">
          <Button>
            <Plus className="size-4" /> Add sub-project
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Slug</TH>
              <TH>Funder</TH>
              <TH className="text-right">Order</TH>
              <TH>Status</TH>
              <TH></TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((s) => (
              <TR key={s.id}>
                <TD className="font-medium text-accent">{s.name}</TD>
                <TD>
                  <Link
                    href={`/programs/${s.slug}`}
                    className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                  >
                    {s.slug}
                    <ExternalLink className="size-3" />
                  </Link>
                </TD>
                <TD className="text-muted-foreground">{s.funder_name ?? '—'}</TD>
                <TD className="text-right tabular-nums">{s.display_order}</TD>
                <TD>
                  {s.is_active ? (
                    <Badge variant="muted">Active</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">Hidden</span>
                  )}
                </TD>
                <TD className="text-right whitespace-nowrap">
                  <Link href={`/admin/sub-projects/${s.id}`} className="inline-block mr-1">
                    <Button variant="ghost" size="sm" aria-label="Edit">
                      <Pencil className="size-4" />
                    </Button>
                  </Link>
                  <form action={deleteSubProject} className="inline-block">
                    <input type="hidden" name="id" value={s.id} />
                    <Button type="submit" variant="ghost" size="sm" aria-label="Delete">
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </form>
                </TD>
              </TR>
            ))}
            {rows.length === 0 && (
              <TR>
                <TD colSpan={6} className="text-center text-muted-foreground py-12">
                  No sub-projects yet.
                </TD>
              </TR>
            )}
          </TBody>
        </Table>
      </div>
    </div>
  );
}
