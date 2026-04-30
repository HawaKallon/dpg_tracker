-- Adds an event_year column so the dashboard can filter by year.
-- Run once in Supabase SQL editor after 0001 + 0002.

alter table public.activities add column if not exists event_year int;

-- Backfill: existing rows are from 2025 unless activity_date says otherwise.
update public.activities
set event_year = coalesce(extract(year from activity_date)::int, 2025)
where event_year is null;

alter table public.activities alter column event_year set not null;
alter table public.activities alter column event_year set default extract(year from now())::int;

create index if not exists activities_event_year_idx on public.activities(event_year);
