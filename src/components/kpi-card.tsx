import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type KpiDelta = {
  pct: number | null;
  prior: number | null;
};

export function KpiCard({
  label,
  value,
  hint,
  delta,
  forceRender,
  className,
}: {
  label: string;
  value: number | string;
  hint?: string;
  delta?: KpiDelta;
  forceRender?: boolean;
  className?: string;
}) {
  if (value == null) return null;
  if (!forceRender && typeof value === 'number' && value === 0) return null;

  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card p-5 sm:p-6 flex flex-col gap-3 shadow-card transition-all hover:shadow-lift hover:-translate-y-0.5',
        className
      )}
    >
      <div className="text-eyebrow text-muted-foreground">{label}</div>
      <div className="font-serif tabular-nums leading-none text-4xl sm:text-5xl tracking-tight text-ink">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {delta && delta.pct !== null && (
        <DeltaRow pct={delta.pct} prior={delta.prior} />
      )}
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function DeltaRow({ pct, prior }: { pct: number; prior: number | null }) {
  const Icon = pct > 0 ? ArrowUpRight : pct < 0 ? ArrowDownRight : Minus;
  const tone =
    pct > 0 ? 'text-success' : pct < 0 ? 'text-accent' : 'text-muted-foreground';
  const sign = pct > 0 ? '+' : '';
  const priorLabel =
    prior == null
      ? 'vs. prior year'
      : `vs. ${prior.toLocaleString()} prior year`;

  return (
    <div className={cn('flex items-center gap-1 text-xs font-medium', tone)}>
      <Icon className="size-3" aria-hidden="true" />
      <span className="tabular-nums">
        {sign}
        {pct}%
      </span>
      <span className="text-muted-foreground font-normal">{priorLabel}</span>
    </div>
  );
}
