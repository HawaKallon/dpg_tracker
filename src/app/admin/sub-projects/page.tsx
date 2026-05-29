import Link from 'next/link';
import { Plus, Trash2, Pencil, ExternalLink, FolderKanban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getSubProjects } from '@/lib/supabase/queries';
import { deleteSubProject } from './actions';
import { ListToolbar, PrimaryAction } from '../_components/list-toolbar';
import { EmptyState } from '../_components/empty-state';
import { ListSearch } from '../_components/list-search';

type SearchParams = Promise<{ q?: string }>;

export default async function AdminSubProjectsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const rows = await getSubProjects();
  const { q } = await searchParams;
  const needle = (q ?? '').trim().toLowerCase();
  const filtered = needle
    ? rows.filter((s) => {
        const hay = [s.name, s.slug, s.funder_name]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(needle);
      })
    : rows;

  return (
    <div className="space-y-6">
      <ListToolbar
        title="Sub-projects"
        count={filtered.length}
        description={
          <>
            Programs surfaced on the public site at{' '}
            <code className="text-foreground bg-muted px-1 py-0.5 rounded text-[11px]">
              /programs/[slug]
            </code>
            .
          </>
        }
        actions={
          <Link href="/admin/sub-projects/new">
            <PrimaryAction>
              <Plus className="size-4" /> Add sub-project
            </PrimaryAction>
          </Link>
        }
      />

      <ListSearch placeholder="Search by name, slug, funder…" />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title={needle ? `No matches for "${q}"` : 'No sub-projects yet'}
            description={
              needle
                ? 'Try a different search term, or clear the search to see all sub-projects.'
                : 'Create your first program to organize activities.'
            }
            action={
              !needle && (
                <Link href="/admin/sub-projects/new">
                  <PrimaryAction>
                    <Plus className="size-4" /> Add sub-project
                  </PrimaryAction>
                </Link>
              )
            }
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Slug</TH>
                <TH>Funder</TH>
                <TH className="text-right">Order</TH>
                <TH>Status</TH>
                <TH className="w-[1%]" />
              </TR>
            </THead>
            <TBody>
              {filtered.map((s) => (
                <TR key={s.id}>
                  <TD className="font-medium text-foreground">{s.name}</TD>
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
                  <TD className="text-right tabular-nums text-muted-foreground">
                    {s.display_order}
                  </TD>
                  <TD>
                    {s.is_active ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="outline">Hidden</Badge>
                    )}
                  </TD>
                  <TD className="whitespace-nowrap">
                    <div className="flex items-center justify-end gap-0.5">
                      <Link href={`/admin/sub-projects/${s.id}`}>
                        <Button variant="ghost" size="sm" aria-label="Edit">
                          <Pencil className="size-4" />
                        </Button>
                      </Link>
                      <form action={deleteSubProject}>
                        <input type="hidden" name="id" value={s.id} />
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
