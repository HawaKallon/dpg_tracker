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
  className,
}: {
  label: string;
  value: number | string;
  hint?: string;
  delta?: KpiDelta;
  className?: string;
}) {
  if (value == null) return null;
  if (typeof value === 'number' && value === 0) return null;

  return (
    <div className={cn('rounded-xl border border-border bg-card p-5', className)}>
      <div className="text-xs text-muted-foreground font-medium">{label}</div>
      <div className="mt-2 text-[32px] leading-none font-semibold tabular-nums text-accent tracking-tight">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {delta && delta.pct !== null && (
        <DeltaRow pct={delta.pct} prior={delta.prior} />
      )}
      {hint && <div className="mt-2 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function DeltaRow({ pct, prior }: { pct: number; prior: number | null }) {
  const Icon = pct > 0 ? ArrowUpRight : pct < 0 ? ArrowDownRight : Minus;
  const tone =
    pct > 0 ? 'text-emerald-700' : pct < 0 ? 'text-rose-700' : 'text-muted-foreground';
  const sign = pct > 0 ? '+' : '';
  const priorLabel =
    prior == null
      ? 'vs. prior year'
      : `vs. ${prior.toLocaleString()} prior year`;

  return (
    <div className={cn('mt-2 flex items-center gap-1 text-xs font-medium', tone)}>
      <Icon className="size-3" aria-hidden="true" />
      <span className="tabular-nums">
        {sign}
        {pct}%
      </span>
      <span className="text-muted-foreground font-normal">{priorLabel}</span>
    </div>
  );
}
