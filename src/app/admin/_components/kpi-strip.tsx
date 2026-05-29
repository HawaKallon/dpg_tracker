import * as React from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type KpiCell = {
  label: string;
  value: number | string;
  icon?: React.ComponentType<{ className?: string }>;
  delta?: { pct: number | null; prior: number | null };
  hint?: string;
};

export function KpiStrip({ cells }: { cells: KpiCell[] }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border">
        {cells.map((cell, i) => (
          <KpiCellView key={i} {...cell} />
        ))}
      </div>
    </div>
  );
}

function KpiCellView({ label, value, icon: Icon, delta, hint }: KpiCell) {
  return (
    <div className="p-5 sm:p-6 flex flex-col gap-2.5 min-w-0">
      <div className="flex items-center gap-2 text-muted-foreground">
        {Icon && <Icon className="size-3.5" />}
        <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl sm:text-[28px] font-semibold tracking-tight tabular-nums text-foreground leading-none">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {delta && delta.pct !== null && (
        <DeltaRow pct={delta.pct} prior={delta.prior} />
      )}
      {hint && !delta && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

function DeltaRow({ pct, prior }: { pct: number; prior: number | null }) {
  const Icon = pct > 0 ? ArrowUpRight : pct < 0 ? ArrowDownRight : Minus;
  const tone =
    pct > 0
      ? 'text-emerald-700'
      : pct < 0
        ? 'text-destructive'
        : 'text-muted-foreground';
  const sign = pct > 0 ? '+' : '';
  const priorLabel =
    prior == null ? 'vs. prior year' : `vs. ${prior.toLocaleString()} prior year`;

  return (
    <div className={cn('flex items-center gap-1 text-xs font-medium', tone)}>
      <Icon className="size-3" aria-hidden="true" />
      <span className="tabular-nums">
        {sign}
        {pct}%
      </span>
      <span className="text-muted-foreground font-normal">· {priorLabel}</span>
    </div>
  );
}
