import Link from 'next/link';
import { Plus, Trash2, Pencil, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { getLocations } from '@/lib/supabase/queries';
import { deleteLocation } from './actions';

export default async function AdminLocationsPage() {
  const rows = await getLocations();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Records
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-accent mt-1">Locations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {rows.length.toLocaleString()} venues. Each has a public detail page at{' '}
            <code className="text-accent">/locations/[slug]</code>.
          </p>
        </div>
        <Link href="/admin/locations/new">
          <Button>
            <Plus className="size-4" /> Add location
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Slug</TH>
              <TH>Type</TH>
              <TH>Partner</TH>
              <TH>Region</TH>
              <TH></TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((l) => (
              <TR key={l.id}>
                <TD>
                  <div className="flex items-center gap-2">
                    {l.logo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={l.logo_url}
                        alt=""
                        className="size-6 rounded object-cover border border-border"
                      />
                    )}
                    <span className="font-medium text-accent">{l.name}</span>
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
                <TD><Badge variant="muted">{l.type}</Badge></TD>
                <TD className="text-muted-foreground">{l.partner_type ?? '—'}</TD>
                <TD className="text-muted-foreground">{l.region ?? '—'}</TD>
                <TD className="text-right whitespace-nowrap">
                  <Link href={`/admin/locations/${l.id}`} className="inline-block mr-1">
                    <Button variant="ghost" size="sm" aria-label="Edit">
                      <Pencil className="size-4" />
                    </Button>
                  </Link>
                  <form action={deleteLocation} className="inline-block">
                    <input type="hidden" name="id" value={l.id} />
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
                  No locations yet.
                </TD>
              </TR>
            )}
          </TBody>
        </Table>
      </div>
    </div>
  );
}
