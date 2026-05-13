import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { KpiDelta } from '@/components/kpi-card';

/**
 * Denser KPI variant — no card chrome. Used in the editorial stat ribbon.
 * Numbers sit in the display serif so they read as the protagonist of the page.
 */
export function StatTile({
  label,
  value,
  hint,
  delta,
  forceRender,
  tone = 'default',
  className,
}: {
  label: string;
  value: number | string;
  hint?: string;
  delta?: KpiDelta;
  forceRender?: boolean;
  tone?: 'default' | 'primary';
  className?: string;
}) {
  if (value == null) return null;
  if (!forceRender && typeof value === 'number' && value === 0) return null;

  return (
    <div
      className={cn(
        'flex flex-col justify-between gap-3 min-w-0',
        tone === 'primary' ? 'text-ink' : 'text-foreground',
        className
      )}
    >
      <span className="text-eyebrow text-muted-foreground">{label}</span>
      <div>
        <div
          className={cn(
            'font-serif tabular-nums leading-none tracking-tight',
            tone === 'primary' ? 'text-5xl sm:text-6xl' : 'text-4xl sm:text-5xl'
          )}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {(delta?.pct !== undefined && delta?.pct !== null) || hint ? (
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            {delta?.pct !== undefined && delta?.pct !== null && (
              <DeltaChip pct={delta.pct} prior={delta.prior} />
            )}
            {hint && <span className="text-muted-foreground">{hint}</span>}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DeltaChip({ pct, prior }: { pct: number; prior: number | null }) {
  const Icon = pct > 0 ? ArrowUpRight : pct < 0 ? ArrowDownRight : Minus;
  const tone =
    pct > 0 ? 'text-success' : pct < 0 ? 'text-accent' : 'text-muted-foreground';
  const sign = pct > 0 ? '+' : '';
  const priorLabel =
    prior == null ? 'vs. prior year' : `vs. ${prior.toLocaleString()} prior year`;
  return (
    <span className={cn('inline-flex items-center gap-1 font-medium', tone)}>
      <Icon className="size-3" aria-hidden="true" />
      <span className="tabular-nums">
        {sign}
        {pct}%
      </span>
      <span className="text-muted-foreground font-normal">{priorLabel}</span>
    </span>
  );
}
