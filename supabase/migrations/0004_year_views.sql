-- Year-aware dashboard helpers.
-- Run once in Supabase SQL editor after 0003.

-- A view of available years (used by the year picker on the dashboard).
create or replace view public.v_years as
select distinct event_year
from public.activities
where event_year is not null
order by event_year desc;

-- Replace the static summary with a function the dashboard calls per year.
drop view if exists public.v_dashboard_summary;

create or replace function public.dashboard_summary(p_year int default null)
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
    coalesce(sum(total_count), 0)::int  as total_participants,
    coalesce(sum(male_count), 0)::int   as total_male,
    coalesce(sum(female_count), 0)::int as total_female,
    coalesce(sum(reach), 0)::int        as total_reach,
    count(*)::int                       as activity_count,
    count(distinct location_id)::int    as location_count
  from public.activities
  where p_year is null or event_year = p_year;
$$;

drop view if exists public.v_by_sub_project;

create or replace function public.by_sub_project(p_year int default null)
returns table (
  id                 uuid,
  name               text,
  slug               text,
  display_order      int,
  total_participants int,
  male               int,
  female             int,
  activity_count     int
)
language sql stable as $$
  select
    sp.id,
    sp.name,
    sp.slug,
    sp.display_order,
    coalesce(sum(a.total_count), 0)::int  as total_participants,
    coalesce(sum(a.male_count), 0)::int   as male,
    coalesce(sum(a.female_count), 0)::int as female,
    count(a.id)::int                      as activity_count
  from public.sub_projects sp
  left join public.activities a
    on a.sub_project_id = sp.id and (p_year is null or a.event_year = p_year)
  group by sp.id, sp.name, sp.slug, sp.display_order
  order by sp.display_order, sp.name;
$$;

drop view if exists public.v_by_month;

create or replace function public.by_month(p_year int default null)
returns table (
  month              text,
  total_participants int,
  activity_count     int
)
language sql stable as $$
  select
    to_char(coalesce(activity_date, make_date(event_year, 1, 1)), 'YYYY-MM') as month,
    coalesce(sum(total_count), 0)::int as total_participants,
    count(*)::int                       as activity_count
  from public.activities
  where p_year is null or event_year = p_year
  group by 1
  order by 1;
$$;

drop view if exists public.v_by_location;

create or replace function public.by_location(p_year int default null)
returns table (
  id                 uuid,
  name               text,
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
    l.type,
    coalesce(sum(a.total_count), 0)::int  as total_participants,
    coalesce(sum(a.male_count), 0)::int   as male,
    coalesce(sum(a.female_count), 0)::int as female,
    count(a.id)::int                      as activity_count
  from public.locations l
  left join public.activities a
    on a.location_id = l.id and (p_year is null or a.event_year = p_year)
  group by l.id, l.name, l.type
  order by total_participants desc, l.name;
$$;
