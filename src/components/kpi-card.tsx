import { cn } from '@/lib/utils/cn';

export function KpiCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: number | string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-5', className)}>
      <div className="text-xs text-muted-foreground font-medium">{label}</div>
      <div className="mt-2 text-[32px] leading-none font-semibold tabular-nums text-accent tracking-tight">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {hint && <div className="mt-2 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
