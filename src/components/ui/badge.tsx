import * as React from 'react';
import { cn } from '@/lib/utils/cn';

type Variant = 'default' | 'success' | 'warning' | 'muted' | 'pink';
const variantClasses: Record<Variant, string> = {
  default: 'bg-primary/10 text-primary-deep',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  muted: 'bg-muted text-accent',
  pink: 'bg-pink/10 text-pink',
};

export function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
