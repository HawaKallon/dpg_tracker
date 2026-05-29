import * as React from 'react';
import { cn } from '@/lib/utils/cn';

type Variant =
  | 'default'
  | 'success'
  | 'warning'
  | 'muted'
  | 'pink'
  | 'outline'
  | 'destructive';

const variantClasses: Record<Variant, string> = {
  default: 'bg-primary/10 text-primary-deep border-primary/15',
  success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-100 text-amber-800 border-amber-200',
  muted: 'bg-muted text-foreground border-border',
  pink: 'bg-pink/10 text-pink border-pink/15',
  outline: 'bg-transparent text-foreground border-border',
  destructive: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium leading-tight whitespace-nowrap',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
