import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import type { PartnerSummaryRow } from '@/lib/supabase/query-types';

export function PartnersList({
  partners,
  year,
}: {
  partners: PartnerSummaryRow[];
  year: number;
}) {
  if (partners.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
        <p className="text-sm text-muted-foreground">
          No partner organizations recorded in {year}. Add partners on the activity form to populate this directory.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-x-auto shadow-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-eyebrow text-muted-foreground border-b border-border">
            <th scope="col" className="px-5 py-3 text-left font-semibold">Partner</th>
            <th scope="col" className="px-5 py-3 text-right font-semibold">Activities</th>
            <th scope="col" className="px-5 py-3 text-right font-semibold">Participants</th>
            <th scope="col" className="px-5 py-3 text-right font-semibold">Reach</th>
            <th scope="col" className="px-5 py-3 text-left font-semibold">Sub-projects</th>
            <th scope="col" className="px-5 py-3 text-left font-semibold">Last seen</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {partners.map((p) => {
            const lastSeen = p.last_activity_date
              ? formatDistanceToNow(new Date(p.last_activity_date), { addSuffix: true })
              : '—';
            const filterHref = `/?year=${year}&partner=${encodeURIComponent(p.partner)}`;
            return (
              <tr key={p.partner} className="group hover:bg-paper/60 transition-colors">
                <td className="px-5 py-4 font-medium text-ink">
                  <Link
                    href={filterHref}
                    className="group-hover:text-accent transition-colors focus-visible:outline-none focus-visible:underline"
                  >
                    {p.partner}
                  </Link>
                </td>
                <td className="px-5 py-4 text-right tabular-nums">{p.activity_count}</td>
                <td className="px-5 py-4 text-right tabular-nums font-serif text-lg">
                  {p.total_participants.toLocaleString()}
                </td>
                <td className="px-5 py-4 text-right tabular-nums text-muted-foreground">
                  {p.total_reach.toLocaleString()}
                </td>
                <td className="px-5 py-4">
                  {p.sub_projects && p.sub_projects.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {p.sub_projects.map((sp) => (
                        <span
                          key={sp}
                          className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs font-medium text-foreground bg-background"
                        >
                          {sp}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">{lastSeen}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
