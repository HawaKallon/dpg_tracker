'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Filter, X } from 'lucide-react';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Option = { id: string; name: string };

type FilterKey = 'sub_project' | 'location' | 'date_from' | 'date_to';

export function FilterBar({
  subProjects,
  locations,
  current,
}: {
  subProjects: Option[];
  locations: Option[];
  current: {
    sub_project?: string;
    location?: string;
    date_from?: string;
    date_to?: string;
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
    (['sub_project', 'location', 'date_from', 'date_to'] satisfies FilterKey[]).forEach((k) =>
      next.delete(k)
    );
    startTransition(() => {
      router.push(`?${next.toString()}`, { scroll: false });
    });
  }

  const hasActive = Boolean(
    current.sub_project || current.location || current.date_from || current.date_to
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground font-medium">
        <Filter className="size-3.5" aria-hidden="true" />
        Filter
      </span>

      <label className="inline-flex items-center gap-2">
        <span className="sr-only">Sub-project</span>
        <Select
          value={current.sub_project ?? ''}
          onChange={(e) => setParam('sub_project', e.target.value)}
          aria-label="Filter by sub-project"
          className="h-9 text-sm"
        >
          <option value="">All sub-projects</option>
          {subProjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </label>

      <label className="inline-flex items-center gap-2">
        <span className="sr-only">Location</span>
        <Select
          value={current.location ?? ''}
          onChange={(e) => setParam('location', e.target.value)}
          aria-label="Filter by location"
          className="h-9 text-sm"
        >
          <option value="">All locations</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </Select>
      </label>

      <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        <span>From</span>
        <Input
          type="date"
          value={current.date_from ?? ''}
          onChange={(e) => setParam('date_from', e.target.value)}
          aria-label="Filter from date"
          className="h-9 text-sm w-[10.5rem]"
        />
      </label>

      <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        <span>To</span>
        <Input
          type="date"
          value={current.date_to ?? ''}
          onChange={(e) => setParam('date_to', e.target.value)}
          aria-label="Filter to date"
          className="h-9 text-sm w-[10.5rem]"
        />
      </label>

      {hasActive && (
        <Button type="button" variant="ghost" size="sm" onClick={clearAll}>
          <X className="size-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
