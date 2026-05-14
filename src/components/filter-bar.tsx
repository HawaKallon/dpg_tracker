'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Filter, Search, X } from 'lucide-react';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Option = { id: string; name: string };

type FilterKey = 'sub_project' | 'location' | 'month' | 'q' | 'partner';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function FilterBar({
  subProjects,
  locations,
  partners,
  current,
}: {
  subProjects: Option[];
  locations: Option[];
  partners?: string[];
  current: {
    sub_project?: string;
    location?: string;
    month?: string;
    q?: string;
    partner?: string;
  };
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  function setParam(key: FilterKey, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    startTransition(() => {
      router.push(`?${next.toString()}`, { scroll: false });
    });
  }

  function clearAll() {
    const next = new URLSearchParams(params.toString());
    (['sub_project', 'location', 'month', 'q', 'partner'] satisfies FilterKey[]).forEach(
      (k) => next.delete(k),
    );
    startTransition(() => {
      router.push(`?${next.toString()}`, { scroll: false });
    });
  }

  const hasActive = Boolean(
    current.sub_project ||
      current.location ||
      current.month ||
      current.q ||
      current.partner,
  );

  const selectClass =
    'h-9 w-auto rounded-full bg-background border-border text-sm pl-3.5 pr-9';

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="inline-flex items-center gap-1.5 text-eyebrow text-muted-foreground">
        <Filter className="size-3.5" aria-hidden="true" />
        Filter
      </span>

      <Select
        value={current.sub_project ?? ''}
        onChange={(e) => setParam('sub_project', e.target.value)}
        aria-label="Filter by sub-project"
        className={selectClass}
      >
        <option value="">All sub-projects</option>
        {subProjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>

      <Select
        value={current.location ?? ''}
        onChange={(e) => setParam('location', e.target.value)}
        aria-label="Filter by location"
        className={selectClass}
      >
        <option value="">All locations</option>
        {locations.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </Select>

      <Select
        value={current.month ?? ''}
        onChange={(e) => setParam('month', e.target.value)}
        aria-label="Filter by month"
        className={selectClass}
      >
        <option value="">All months</option>
        {MONTHS.map((m, i) => (
          <option key={m} value={String(i + 1)}>
            {m}
          </option>
        ))}
      </Select>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={current.q ?? ''}
          onChange={(e) => setParam('q', e.target.value)}
          placeholder="Search notes"
          aria-label="Search activities"
          className="h-9 rounded-full bg-background border-border text-sm w-[12rem] pl-8"
        />
      </div>

      {partners && partners.length > 0 && (
        <Select
          value={current.partner ?? ''}
          onChange={(e) => setParam('partner', e.target.value)}
          aria-label="Filter by partner"
          className={selectClass}
        >
          <option value="">All partners</option>
          {partners.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
      )}

      {hasActive && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="rounded-full"
        >
          <X className="size-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
