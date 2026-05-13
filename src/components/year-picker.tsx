'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, Calendar } from 'lucide-react';

export function YearPicker({ years, current }: { years: number[]; current: number }) {
  const router = useRouter();
  const params = useSearchParams();

  function setYear(y: string) {
    const next = new URLSearchParams(params.toString());
    next.set('year', y);
    router.push(`?${next.toString()}`, { scroll: false });
  }

  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Year</span>
      <Calendar
        className="size-4 absolute left-4 text-ink pointer-events-none"
        aria-hidden="true"
      />
      <select
        value={current}
        onChange={(e) => setYear(e.target.value)}
        className="appearance-none h-10 pl-10 pr-10 rounded-full border border-border bg-background text-sm font-medium text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer hover:bg-card transition-colors"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <ChevronDown
        className="size-4 absolute right-3.5 text-muted-foreground pointer-events-none"
        aria-hidden="true"
      />
    </label>
  );
}
