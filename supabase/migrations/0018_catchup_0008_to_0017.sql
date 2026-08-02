-- ============================================================================
-- CATCH-UP MIGRATION — brings a database sitting at 0007 up to 0017.
--
-- WHY THIS FILE EXISTS
-- Migrations in this repo are applied by hand and nothing tracks what has run.
-- On 2026-08-02 the live project was found to be at 0007: activities.outcomes,
-- .highlights, .media_urls, .partner_orgs, .age_bands, .roles and the
-- demographics_taxonomy / rate_limits tables did not exist. The admin activity
-- form was silently dropping every one of those fields on save (see the
-- column-fallback loop that used to live in src/app/admin/activities/actions.ts).
--
-- This file is the consolidated, idempotent contents of 0008 → 0017. Running it
-- on a database that already has some or all of those objects is a no-op.
-- Paste the whole thing into the Supabase SQL editor and run it once.
--
-- PRE-FLIGHT — run this first and read the result:
--
--     select id, email, role from public.profiles order by role;
--
-- Section 9 (from 0016) replaces profiles_role_check with
-- check (role in ('super_admin','admin','viewer')). If any existing row has a
-- role outside that set, the ALTER will fail — fix those rows first. Roles
-- created before 0016 are 'admin' or 'viewer', so this normally passes.
--
-- On the live project as of 2026-08-02 the single profile is already
-- 'super_admin', i.e. 0016 was applied ahead of 0008–0015. Section 9 is
-- therefore expected to be a no-op there; it is kept so this file also works on
-- a database that never got 0016.
--
-- POST-FLIGHT — after 0016, newly invited users default to 'viewer', not
-- 'admin', and only a super_admin can reach /admin/users. Promote yourself:
--
--     npx tsx scripts/promote-super-admin.ts <your-email>
--
-- Verify at the bottom of this file.
-- ============================================================================


-- ============================================================
-- 1. Activity enrichment                              (was 0008)
-- ============================================================

alter table public.activities
  add column if not exists outcomes     jsonb,
  add column if not exists highlights   text,
  add column if not exists media_urls   text[] not null default '{}',
  add column if not exists partner_orgs text[] not null default '{}';


-- ============================================================
-- 2. Sub-project enrichment                           (was 0009)
-- ============================================================

alter table public.sub_projects
  add column if not exists description      jsonb,
  add column if not exists hero_image_url   text,
  add column if not exists funder_name      text,
  add column if not exists funder_logo_url  text;


-- ============================================================
-- 3. Location detail RPCs                             (was 0010)
-- ============================================================

create or replace function public.location_summary(p_slug text, p_year int default null)
returns table (
  total_participants int,
  total_male         int,
  total_female       int,
  total_reach        int,
  activity_count     int,
  sub_project_count  int
)
language sql stable as $$
  select
    coalesce(sum(a.total_count), 0)::int     as total_participants,
    coalesce(sum(a.male_count), 0)::int      as total_male,
    coalesce(sum(a.female_count), 0)::int    as total_female,
    coalesce(sum(a.reach), 0)::int           as total_reach,
    count(a.id)::int                         as activity_count,
    count(distinct a.sub_project_id)::int    as sub_project_count
  from public.locations l
  left join public.activities a
    on a.location_id = l.id and (p_year is null or a.event_year = p_year)
  where l.slug = p_slug;
$$;

create or replace function public.location_monthly(p_slug text, p_year int default null)
returns table (
  month              text,
  total_participants int,
  activity_count     int
)
language sql stable as $$
  select
    to_char(coalesce(a.activity_date, make_date(a.event_year, 1, 1)), 'YYYY-MM') as month,
    coalesce(sum(a.total_count), 0)::int as total_participants,
    count(*)::int                         as activity_count
  from public.activities a
  join public.locations l on l.id = a.location_id
  where l.slug = p_slug
    and (p_year is null or a.event_year = p_year)
  group by 1
  order by 1;
$$;

create or replace function public.location_sub_project_mix(p_slug text, p_year int default null)
returns table (
  id                 uuid,
  name               text,
  slug               text,
  total_participants int,
  activity_count     int
)
language sql stable as $$
  select
    sp.id,
    sp.name,
    sp.slug,
    coalesce(sum(a.total_count), 0)::int as total_participants,
    count(a.id)::int                     as activity_count
  from public.sub_projects sp
  join public.activities a   on a.sub_project_id = sp.id
  join public.locations  l   on l.id = a.location_id
  where l.slug = p_slug
    and (p_year is null or a.event_year = p_year)
  group by sp.id, sp.name, sp.slug
  having count(a.id) > 0
  order by total_participants desc;
$$;


-- ============================================================
-- 4. Sub-project detail RPCs                          (was 0010)
-- ============================================================

create or replace function public.sub_project_summary(p_slug text, p_year int default null)
returns table (
  total_participants int,
  total_male         int,
  total_female       int,
  total_reach        int,
  activity_count     int,
  location_count     int
)
language sql stable as $$
  select
    coalesce(sum(a.total_count), 0)::int  as total_participants,
    coalesce(sum(a.male_count), 0)::int   as total_male,
    coalesce(sum(a.female_count), 0)::int as total_female,
    coalesce(sum(a.reach), 0)::int        as total_reach,
    count(a.id)::int                      as activity_count,
    count(distinct a.location_id)::int    as location_count
  from public.sub_projects sp
  left join public.activities a
    on a.sub_project_id = sp.id and (p_year is null or a.event_year = p_year)
  where sp.slug = p_slug;
$$;

create or replace function public.sub_project_monthly(p_slug text, p_year int default null)
returns table (
  month              text,
  total_participants int,
  activity_count     int
)
language sql stable as $$
  select
    to_char(coalesce(a.activity_date, make_date(a.event_year, 1, 1)), 'YYYY-MM') as month,
    coalesce(sum(a.total_count), 0)::int as total_participants,
    count(*)::int                         as activity_count
  from public.activities a
  join public.sub_projects sp on sp.id = a.sub_project_id
  where sp.slug = p_slug
    and (p_year is null or a.event_year = p_year)
  group by 1
  order by 1;
$$;

create or replace function public.sub_project_location_mix(p_slug text, p_year int default null)
returns table (
  id                 uuid,
  name               text,
  slug               text,
  total_participants int,
  activity_count     int
)
language sql stable as $$
  select
    l.id,
    l.name,
    l.slug,
    coalesce(sum(a.total_count), 0)::int as total_participants,
    count(a.id)::int                     as activity_count
  from public.locations  l
  join public.activities a   on a.location_id   = l.id
  join public.sub_projects sp on sp.id = a.sub_project_id
  where sp.slug = p_slug
    and (p_year is null or a.event_year = p_year)
  group by l.id, l.name, l.slug
  having count(a.id) > 0
  order by total_participants desc;
$$;


-- ============================================================
-- 5. Partners directory + top movers                  (was 0011)
-- ============================================================

create or replace function public.partners_summary(p_year int default null)
returns table (
  partner            text,
  activity_count     int,
  total_participants int,
  total_reach        int,
  sub_projects       text[],
  last_activity_date date
)
language sql stable as $$
  select
    p.partner,
    count(*)::int                                                                     as activity_count,
    coalesce(sum(a.total_count), 0)::int                                              as total_participants,
    coalesce(sum(a.reach), 0)::int                                                    as total_reach,
    array_agg(distinct sp.name order by sp.name) filter (where sp.name is not null)   as sub_projects,
    max(a.activity_date)                                                              as last_activity_date
  from public.activities a
  cross join lateral unnest(coalesce(a.partner_orgs, '{}'::text[])) as p(partner)
  left join public.sub_projects sp on sp.id = a.sub_project_id
  where (p_year is null or a.event_year = p_year)
    and length(trim(p.partner)) > 0
  group by p.partner
  order by activity_count desc, total_participants desc, p.partner;
$$;

create or replace function public.report_top_movers(
  p_year int,
  p_dim  text default 'sub_project'
)
returns table (
  id            uuid,
  name          text,
  slug          text,
  current_value int,
  prior_value   int,
  delta_pct     numeric
)
language plpgsql stable as $$
begin
  if p_dim = 'sub_project' then
    return query
      with curr as (
        select sp.id, sp.name, sp.slug,
               coalesce(sum(a.total_count), 0)::int as value
        from public.sub_projects sp
        left join public.activities a
          on a.sub_project_id = sp.id and a.event_year = p_year
        group by sp.id, sp.name, sp.slug
      ),
      prev as (
        select sp.id,
               coalesce(sum(a.total_count), 0)::int as value
        from public.sub_projects sp
        left join public.activities a
          on a.sub_project_id = sp.id and a.event_year = p_year - 1
        group by sp.id
      )
      select c.id, c.name, c.slug,
             c.value,
             coalesce(p.value, 0),
             case
               when coalesce(p.value, 0) = 0 then null
               else round(((c.value - p.value)::numeric / p.value) * 100, 1)
             end
      from curr c
      left join prev p on p.id = c.id
      where c.value > 0 or coalesce(p.value, 0) > 0
      order by
        case
          when coalesce(p.value, 0) = 0 then 0
          else abs((c.value - p.value)::numeric / nullif(p.value, 0))
        end desc nulls last,
        c.value desc;
  elsif p_dim = 'location' then
    return query
      with curr as (
        select l.id, l.name, l.slug,
               coalesce(sum(a.total_count), 0)::int as value
        from public.locations l
        left join public.activities a
          on a.location_id = l.id and a.event_year = p_year
        group by l.id, l.name, l.slug
      ),
      prev as (
        select l.id,
               coalesce(sum(a.total_count), 0)::int as value
        from public.locations l
        left join public.activities a
          on a.location_id = l.id and a.event_year = p_year - 1
        group by l.id
      )
      select c.id, c.name, c.slug,
             c.value,
             coalesce(p.value, 0),
             case
               when coalesce(p.value, 0) = 0 then null
               else round(((c.value - p.value)::numeric / p.value) * 100, 1)
             end
      from curr c
      left join prev p on p.id = c.id
      where c.value > 0 or coalesce(p.value, 0) > 0
      order by
        case
          when coalesce(p.value, 0) = 0 then 0
          else abs((c.value - p.value)::numeric / nullif(p.value, 0))
        end desc nulls last,
        c.value desc;
  else
    raise exception 'Invalid dimension: % (expected sub_project or location)', p_dim;
  end if;
end;
$$;


-- ============================================================
-- 6. Activity demographics + taxonomy                 (was 0012)
-- ============================================================

alter table public.activities
  add column if not exists age_bands text[] not null default '{}',
  add column if not exists roles     text[] not null default '{}';

create table if not exists public.demographics_taxonomy (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in ('age_band', 'role')),
  value         text not null,
  display_order int  not null default 0,
  created_at    timestamptz not null default now(),
  unique (kind, value)
);

create index if not exists demographics_taxonomy_kind_order_idx
  on public.demographics_taxonomy (kind, display_order, value);

alter table public.demographics_taxonomy enable row level security;

drop policy if exists "public select demographics_taxonomy" on public.demographics_taxonomy;
drop policy if exists "admin write demographics_taxonomy"   on public.demographics_taxonomy;

create policy "public select demographics_taxonomy"
  on public.demographics_taxonomy for select
  using (true);

create policy "admin write demographics_taxonomy"
  on public.demographics_taxonomy for all
  using (public.is_admin())
  with check (public.is_admin());

insert into public.demographics_taxonomy (kind, value, display_order) values
  ('age_band', 'Under 18',          1),
  ('age_band', '18–24',             2),
  ('age_band', '25–34',             3),
  ('age_band', '35–44',             4),
  ('age_band', '45+',               5),
  ('role',     'Student',           1),
  ('role',     'Educator',          2),
  ('role',     'Developer',         3),
  ('role',     'Public servant',    4),
  ('role',     'Community member',  5),
  ('role',     'Researcher',        6),
  ('role',     'Entrepreneur',      7)
on conflict (kind, value) do nothing;


-- ============================================================
-- 7. Rate limiting                                    (was 0012)
-- ============================================================

create table if not exists public.rate_limits (
  user_id      uuid        not null,
  bucket       text        not null,
  window_start timestamptz not null,
  count        int         not null default 1,
  primary key (user_id, bucket, window_start)
);

create index if not exists rate_limits_window_idx
  on public.rate_limits (window_start);

alter table public.rate_limits enable row level security;

-- No client access. Server Actions reach this only through check_rate_limit(),
-- which is security definer.
drop policy if exists "rate_limits deny all" on public.rate_limits;
create policy "rate_limits deny all"
  on public.rate_limits for all
  using (false)
  with check (false);

create or replace function public.check_rate_limit(
  p_user_id        uuid,
  p_bucket         text,
  p_window_seconds int default 60,
  p_max            int default 30
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamptz;
  v_count        int;
begin
  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.rate_limits (user_id, bucket, window_start, count)
  values (p_user_id, p_bucket, v_window_start, 1)
  on conflict (user_id, bucket, window_start)
    do update set count = public.rate_limits.count + 1
  returning count into v_count;

  delete from public.rate_limits where window_start < now() - interval '1 hour';

  return v_count <= p_max;
end;
$$;

revoke all on function public.check_rate_limit(uuid, text, int, int) from public;
grant execute on function public.check_rate_limit(uuid, text, int, int) to authenticated, service_role;


-- ============================================================
-- 8. Location de-duplication                    (was 0013–0015)
--
-- 0013 merged a hand-picked set of UUIDs; it is a no-op once those rows are
-- gone. 0014 (short codes) and 0015 (full official names) are name-based DO
-- blocks and are safe to re-run — 0015 supersedes 0014's naming, so only 0015
-- is carried here.
-- ============================================================

-- 0013: hand-merged duplicates. No-op if the duplicate IDs are already gone.
update public.activities
   set location_id = '9217952f-0b16-4a7d-a04e-74ae09b55416'  -- Fourah Bay College
 where location_id in (
   '73f71164-8e53-4619-ae90-99a958fb7a56',   -- "…Digital Learningg Hub"
   '425881b9-cef4-4386-b887-db1c60ea0a09'    -- "…Outreach"
 );

update public.activities
   set location_id = '1a6c499d-2eea-45cf-869b-36bb690b8bf3'  -- Njala University - Bo Campus
 where location_id = '6d9042cb-c083-4757-9c97-8aeab2b1fd67'; -- "Njala - Bo Campus"

update public.activities
   set location_id = 'b32daec4-2c32-4db4-99ad-f35c0313d8b3'  -- Limkokwing University
 where location_id = '65b3094a-4d33-4c17-969f-4b222c0f6d1c'; -- "MoCTI + Limkokwing"

delete from public.locations
 where id in (
   '73f71164-8e53-4619-ae90-99a958fb7a56',
   '425881b9-cef4-4386-b887-db1c60ea0a09',
   '6d9042cb-c083-4757-9c97-8aeab2b1fd67',
   '65b3094a-4d33-4c17-969f-4b222c0f6d1c'
 );

-- 0015: name-based merge onto official full names. Keep the anchors in lockstep
-- with LOCATION_ANCHORS in src/lib/utils/canonical-location.ts.
do $$
declare
  anchor record;
  canonical_id uuid;
begin
  for anchor in
    select * from (values
      (
        'Fourah Bay College',
        '(lower(name) = ''fbc'' or lower(name) like ''%fourah bay college%'')'
      ),
      (
        'Limkokwing University of Creative Technology',
        '(lower(name) = ''luct'' or lower(name) like ''%limkokwing%'')'
      )
    ) as t(full_name, predicate)
  loop
    execute format($f$
      select coalesce(
        (
          select id from public.locations
           where lower(trim(name)) = lower(%L)
           limit 1
        ),
        (
          select l.id
            from public.locations l
            left join public.activities a on a.location_id = l.id
           where %s
           group by l.id
           order by count(a.id) desc, l.created_at asc
           limit 1
        )
      )
    $f$, anchor.full_name, anchor.predicate)
    into canonical_id;

    continue when canonical_id is null;

    update public.locations
       set name = anchor.full_name
     where id = canonical_id
       and name is distinct from anchor.full_name;

    execute format($f$
      update public.activities
         set location_id = %L
       where location_id in (
         select id from public.locations
          where %s
            and id <> %L
       )
    $f$, canonical_id, anchor.predicate, canonical_id);

    execute format($f$
      delete from public.locations
       where %s
         and id <> %L
    $f$, anchor.predicate, canonical_id);
  end loop;
end$$;


-- ============================================================
-- 9. super_admin role                                 (was 0016)
--
-- super_admin: full access including inviting/managing users
-- admin:       manage activities, locations, programs (no user management)
-- viewer:      read-only sign-in (no admin writes)
--
-- See the PRE-FLIGHT note at the top before running this section.
-- ============================================================

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('super_admin', 'admin', 'viewer'));

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'super_admin')
  );
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role text := coalesce(nullif(trim(new.raw_user_meta_data->>'profile_role'), ''), 'viewer');
begin
  if v_role not in ('super_admin', 'admin', 'viewer') then
    v_role := 'viewer';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    v_role
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        role = excluded.role;
  return new;
end $$;


-- ============================================================
-- 10. v_years security_invoker                        (was 0017)
-- ============================================================

create or replace view public.v_years
with (security_invoker = true)
as
select distinct event_year
from public.activities
where event_year is not null
order by event_year desc;


-- ============================================================
-- 11. Tell PostgREST about the new columns
--
-- Without this, the API keeps serving a stale schema cache and inserts still
-- fail with "Could not find the 'outcomes' column of 'activities'".
-- ============================================================

notify pgrst, 'reload schema';


-- ============================================================
-- VERIFY — run these after the migration. All should succeed.
-- ============================================================
--
-- select outcomes, highlights, media_urls, partner_orgs, age_bands, roles
--   from public.activities limit 1;
--
-- select count(*) from public.demographics_taxonomy;      -- expect 12
-- select public.check_rate_limit(auth.uid(), 'probe', 60, 100);
-- select public.partners_summary(null);
-- select id, email, role from public.profiles;
