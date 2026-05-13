import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export function ListToolbar({
  title,
  count,
  description,
  actions,
  className,
}: {
  title: string;
  count?: number;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-end justify-between gap-4 flex-wrap',
        className,
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {typeof count === 'number' && (
            <span className="inline-flex items-center rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground tabular-nums">
              {count.toLocaleString()}
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}

export function PrimaryAction({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md text-sm font-medium',
        'bg-foreground text-background hover:bg-foreground/90 transition-colors',
        'disabled:pointer-events-none disabled:opacity-50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      {...props}
    />
  );
}
