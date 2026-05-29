-- Phase 2 — Detail-page RPCs.
-- Per-location and per-sub-project summary/monthly/mix functions, all year-aware.
-- Apply after 0009.

-- ============================================================
-- Location detail RPCs
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
-- Sub-project detail RPCs
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
