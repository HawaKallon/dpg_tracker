-- Phase 2 — Location enrichment + Storage setup.
-- Adds slug + narrative/identity fields to locations, sets up the dpg-media bucket,
-- and refreshes by_location() so the dashboard grid can link by slug.
-- Apply in the Supabase SQL editor (or `supabase db push`) after 0006.

create extension if not exists unaccent;

-- ============================================================
-- Slugify helper (reused by enrichment migrations + trigger)
-- ============================================================

create or replace function public.slugify(p_text text)
returns text language sql immutable as $$
  select nullif(
    trim(both '-' from regexp_replace(
      lower(unaccent(coalesce(p_text, ''))),
      '[^a-z0-9]+', '-', 'g'
    )),
    ''
  );
$$;

-- ============================================================
-- locations enrichment columns
-- ============================================================

alter table public.locations
  add column if not exists slug              text,
  add column if not exists description       jsonb,
  add column if not exists logo_url          text,
  add column if not exists website_url       text,
  add column if not exists lat               numeric(9,6),
  add column if not exists lng               numeric(9,6),
  add column if not exists partner_type      text,
  add column if not exists first_active_date date;

-- Backfill slug for existing rows with a uniqueness loop.
do $$
declare
  r         record;
  base      text;
  candidate text;
  n         int;
begin
  for r in select id, name from public.locations where slug is null loop
    base := coalesce(public.slugify(r.name), 'loc-' || substring(r.id::text, 1, 8));
    candidate := base;
    n := 1;
    while exists (select 1 from public.locations where slug = candidate and id <> r.id) loop
      n := n + 1;
      candidate := base || '-' || n;
    end loop;
    update public.locations set slug = candidate where id = r.id;
  end loop;
end $$;

alter table public.locations alter column slug set not null;
alter table public.locations add constraint locations_slug_key unique (slug);
create index if not exists locations_slug_idx on public.locations(slug);

-- Auto-fill slug on insert/update when blank (does not overwrite admin-set values).
create or replace function public.locations_autofill_slug()
returns trigger language plpgsql as $$
declare
  base      text;
  candidate text;
  n         int;
begin
  if new.slug is null or trim(new.slug) = '' then
    base := coalesce(public.slugify(new.name), 'loc-' || substring(new.id::text, 1, 8));
    candidate := base;
    n := 1;
    while exists (select 1 from public.locations where slug = candidate and id <> new.id) loop
      n := n + 1;
      candidate := base || '-' || n;
    end loop;
    new.slug := candidate;
  end if;
  return new;
end $$;

drop trigger if exists locations_autofill_slug on public.locations;
create trigger locations_autofill_slug
  before insert or update on public.locations
  for each row execute function public.locations_autofill_slug();

-- ============================================================
-- Refresh by_location to include slug (so the dashboard grid can link)
-- ============================================================

drop function if exists public.by_location(int);

create or replace function public.by_location(p_year int default null)
returns table (
  id                 uuid,
  name               text,
  slug               text,
  type               text,
  total_participants int,
  male               int,
  female             int,
  activity_count     int
)
language sql stable as $$
  select
    l.id,
    l.name,
    l.slug,
    l.type,
    coalesce(sum(a.total_count), 0)::int  as total_participants,
    coalesce(sum(a.male_count), 0)::int   as male,
    coalesce(sum(a.female_count), 0)::int as female,
    count(a.id)::int                      as activity_count
  from public.locations l
  left join public.activities a
    on a.location_id = l.id and (p_year is null or a.event_year = p_year)
  group by l.id, l.name, l.slug, l.type
  order by total_participants desc, l.name;
$$;

-- ============================================================
-- Storage bucket: dpg-media (public read, admin write via is_admin())
-- ============================================================

insert into storage.buckets (id, name, public)
values ('dpg-media', 'dpg-media', true)
on conflict (id) do nothing;

drop policy if exists "dpg-media public read"   on storage.objects;
drop policy if exists "dpg-media admin insert"  on storage.objects;
drop policy if exists "dpg-media admin update"  on storage.objects;
drop policy if exists "dpg-media admin delete"  on storage.objects;

create policy "dpg-media public read"
  on storage.objects for select
  using (bucket_id = 'dpg-media');

create policy "dpg-media admin insert"
  on storage.objects for insert
  with check (bucket_id = 'dpg-media' and public.is_admin());

create policy "dpg-media admin update"
  on storage.objects for update
  using (bucket_id = 'dpg-media' and public.is_admin())
  with check (bucket_id = 'dpg-media' and public.is_admin());

create policy "dpg-media admin delete"
  on storage.objects for delete
  using (bucket_id = 'dpg-media' and public.is_admin());
