'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export function ChipInput({
  values,
  onChange,
  placeholder,
  className,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  className?: string;
}) {
  const [draft, setDraft] = useState('');

  const push = () => {
    const v = draft.trim();
    setDraft('');
    if (!v) return;
    if (values.includes(v)) return;
    onChange([...values, v]);
  };

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1.5 focus-within:ring-2 focus-within:ring-primary',
        className
      )}
    >
      {values.map((v, i) => (
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
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            push();
          } else if (e.key === 'Backspace' && draft === '' && values.length) {
            e.preventDefault();
            onChange(values.slice(0, -1));
          }
        }}
        onBlur={push}
        placeholder={values.length ? '' : placeholder}
        className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
