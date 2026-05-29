import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type Row = {
  label: string;
  current: number;
  prior: number;
};

function deltaPct(current: number, prior: number): number | null {
  if (prior <= 0) return null;
  return Math.round(((current - prior) / prior) * 100);
}

export function YoyKpiRow({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-eyebrow text-muted-foreground border-b border-border">
            <th scope="col" className="px-5 py-3 text-left font-semibold">Metric</th>
            <th scope="col" className="px-5 py-3 text-right font-semibold">Current year</th>
            <th scope="col" className="px-5 py-3 text-right font-semibold">Prior year</th>
            <th scope="col" className="px-5 py-3 text-right font-semibold">Change</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => {
            const pct = deltaPct(r.current, r.prior);
            const Icon = pct === null ? Minus : pct > 0 ? ArrowUpRight : pct < 0 ? ArrowDownRight : Minus;
            const tone =
              pct === null
                ? 'text-muted-foreground'
                : pct > 0
                  ? 'text-success'
                  : pct < 0
                    ? 'text-accent'
                    : 'text-muted-foreground';
            return (
              <tr key={r.label} className="hover:bg-paper/60 transition-colors">
                <td className="px-5 py-4 font-medium text-ink">{r.label}</td>
                <td className="px-5 py-4 text-right tabular-nums font-serif text-lg">
                  {r.current.toLocaleString()}
                </td>
                <td className="px-5 py-4 text-right tabular-nums text-muted-foreground">
                  {r.prior.toLocaleString()}
                </td>
                <td className={cn('px-5 py-4 text-right tabular-nums font-medium', tone)}>
                  <span className="inline-flex items-center gap-1 justify-end">
                    <Icon className="size-3.5" aria-hidden="true" />
                    {pct === null ? '—' : `${pct > 0 ? '+' : ''}${pct}%`}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
