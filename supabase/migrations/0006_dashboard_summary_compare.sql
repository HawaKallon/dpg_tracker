-- Year-over-year compare helper for KPI cards.
-- Returns current-year and prior-year totals side by side so the dashboard
-- can render trend arrows without a second round-trip.
-- Run once in the Supabase SQL editor after 0005.

create or replace function public.dashboard_summary_compare(p_year int)
returns table (
  total_participants     int,
  total_male             int,
  total_female           int,
  total_reach            int,
  activity_count         int,
  location_count         int,
  prior_participants     int,
  prior_male             int,
  prior_female           int,
  prior_reach            int,
  prior_activity_count   int,
  prior_location_count   int
)
language sql stable as $$
  with current as (
    select
      coalesce(sum(total_count), 0)::int  as total_participants,
      coalesce(sum(male_count), 0)::int   as total_male,
      coalesce(sum(female_count), 0)::int as total_female,
      coalesce(sum(reach), 0)::int        as total_reach,
      count(*)::int                       as activity_count,
      count(distinct location_id)::int    as location_count
    from public.activities
    where event_year = p_year
  ),
  prior as (
    select
      coalesce(sum(total_count), 0)::int  as prior_participants,
      coalesce(sum(male_count), 0)::int   as prior_male,
      coalesce(sum(female_count), 0)::int as prior_female,
      coalesce(sum(reach), 0)::int        as prior_reach,
      count(*)::int                       as prior_activity_count,
      count(distinct location_id)::int    as prior_location_count
    from public.activities
    where event_year = p_year - 1
  )
  select
    current.total_participants,
    current.total_male,
    current.total_female,
    current.total_reach,
    current.activity_count,
    current.location_count,
    prior.prior_participants,
    prior.prior_male,
    prior.prior_female,
    prior.prior_reach,
    prior.prior_activity_count,
    prior.prior_location_count
  from current cross join prior;
$$;
