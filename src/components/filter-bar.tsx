'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Filter, X } from 'lucide-react';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Option = { id: string; name: string };

type FilterKey = 'sub_project' | 'location' | 'date_from' | 'date_to' | 'partner';

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
    date_from?: string;
    date_to?: string;
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
    (['sub_project', 'location', 'date_from', 'date_to', 'partner'] satisfies FilterKey[]).forEach(
      (k) => next.delete(k)
    );
    startTransition(() => {
      router.push(`?${next.toString()}`, { scroll: false });
    });
  }

  const hasActive = Boolean(
    current.sub_project ||
      current.location ||
      current.date_from ||
      current.date_to ||
      current.partner
  );

  const selectClass =
    'h-9 rounded-full bg-background border-border text-sm pl-3.5 pr-9';
  const dateClass =
    'h-9 rounded-full bg-background border-border text-sm w-[10.5rem]';

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

      <Input
        type="date"
        value={current.date_from ?? ''}
        onChange={(e) => setParam('date_from', e.target.value)}
        aria-label="Filter from date"
        className={dateClass}
      />

      <Input
        type="date"
        value={current.date_to ?? ''}
        onChange={(e) => setParam('date_to', e.target.value)}
        aria-label="Filter to date"
        className={dateClass}
      />

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
