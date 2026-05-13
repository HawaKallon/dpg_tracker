'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export function TaxonomyChips({
  values,
  onChange,
  options,
  placeholder = 'Add…',
  className,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  options: string[];
  placeholder?: string;
  className?: string;
}) {
  const [pending, setPending] = useState('');
  const remaining = options.filter((o) => !values.includes(o));

  function add(value: string) {
    const v = value.trim();
    if (!v) return;
    if (values.includes(v)) return;
    onChange([...values, v]);
    setPending('');
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1.5 min-h-[40px]">
        {values.length === 0 ? (
          <span className="text-xs text-muted-foreground px-1">No tags yet.</span>
        ) : (
          values.map((v, i) => (
            <span
              key={`${v}-${i}`}
              className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs text-accent"
            >
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter((_, idx) => idx !== i))}
                className="inline-flex items-center text-muted-foreground hover:text-destructive"
                aria-label={`Remove ${v}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))
        )}
      </div>
      {remaining.length > 0 && (
        <select
          value={pending}
          onChange={(e) => {
            const v = e.target.value;
            if (v) add(v);
          }}
          className="h-9 px-2 rounded-md border border-border bg-card text-sm text-accent shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={placeholder}
        >
          <option value="">{placeholder}</option>
          {remaining.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
