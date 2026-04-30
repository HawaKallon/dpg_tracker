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
      <Calendar className="size-4 absolute left-3 text-primary-deep pointer-events-none" />
      <select
        value={current}
        onChange={(e) => setYear(e.target.value)}
        className="appearance-none h-10 pl-9 pr-9 rounded-md border border-border bg-card text-sm font-medium text-accent shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <ChevronDown className="size-4 absolute right-3 text-muted-foreground pointer-events-none" />
    </label>
  );
}
