import Link from 'next/link';
import { Plus, Trash2, Pencil, ExternalLink, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getLocations } from '@/lib/supabase/queries';
import { deleteLocation } from './actions';
import { ListToolbar, PrimaryAction } from '../_components/list-toolbar';
import { EmptyState } from '../_components/empty-state';
import { ListSearch } from '../_components/list-search';

type SearchParams = Promise<{ q?: string }>;

export default async function AdminLocationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const rows = await getLocations();
  const { q } = await searchParams;
  const needle = (q ?? '').trim().toLowerCase();
  const filtered = needle
    ? rows.filter((l) => {
        const hay = [l.name, l.slug, l.partner_type, l.region, l.type]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(needle);
      })
    : rows;

  return (
    <div className="space-y-6">
      <ListToolbar
        title="Locations"
        count={filtered.length}
        description={
          <>
            Venues where activities take place. Each has a public page at{' '}
            <code className="text-foreground bg-muted px-1 py-0.5 rounded text-[11px]">
              /locations/[slug]
            </code>
            .
          </>
        }
        actions={
          <Link href="/admin/locations/new">
            <PrimaryAction>
              <Plus className="size-4" /> Add location
            </PrimaryAction>
          </Link>
        }
      />

      <ListSearch placeholder="Search by name, slug, partner, region…" />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title={needle ? `No matches for "${q}"` : 'No locations yet'}
            description={
              needle
                ? 'Try a different search term, or clear the search to see all locations.'
                : 'Add a venue, hub, or university to start tagging activities.'
            }
            action={
              !needle && (
                <Link href="/admin/locations/new">
                  <PrimaryAction>
                    <Plus className="size-4" /> Add location
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
                <TH>Type</TH>
                <TH>Partner</TH>
                <TH>Region</TH>
                <TH className="w-[1%]" />
              </TR>
            </THead>
            <TBody>
              {filtered.map((l) => (
                <TR key={l.id}>
                  <TD>
                    <div className="flex items-center gap-2.5">
                      {l.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={l.logo_url}
                          alt=""
                          className="size-7 rounded-md object-cover border border-border"
                        />
                      ) : (
                        <span className="inline-flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          <MapPin className="size-3.5" />
                        </span>
                      )}
                      <span className="font-medium text-foreground">{l.name}</span>
                    </div>
                  </TD>
                  <TD>
                    <Link
                      href={`/locations/${l.slug}`}
                      className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                    >
                      {l.slug}
                      <ExternalLink className="size-3" />
                    </Link>
                  </TD>
                  <TD>
                    <Badge variant="muted">{l.type}</Badge>
                  </TD>
                  <TD className="text-muted-foreground">{l.partner_type ?? '—'}</TD>
                  <TD className="text-muted-foreground">{l.region ?? '—'}</TD>
                  <TD className="whitespace-nowrap">
                    <div className="flex items-center justify-end gap-0.5">
                      <Link href={`/admin/locations/${l.id}`}>
                        <Button variant="ghost" size="sm" aria-label="Edit">
                          <Pencil className="size-4" />
                        </Button>
                      </Link>
                      <form action={deleteLocation}>
                        <input type="hidden" name="id" value={l.id} />
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
