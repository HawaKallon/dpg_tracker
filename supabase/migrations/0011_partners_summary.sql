-- Phase 3 — Partners directory + YoY report top-movers RPCs.
-- Two read-only aggregates over the activities fact table:
--   - partners_summary(year): unnests activities.partner_orgs into one row per partner
--   - report_top_movers(year, dim): per-dimension current/prior totals with delta %
-- Apply after 0010.

-- ============================================================
-- partners_summary
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

-- ============================================================
-- report_top_movers
-- Returns every sub-project (p_dim='sub_project') or location (p_dim='location')
-- with current/prior participant totals and delta %. The caller slices for top
-- risers / top fallers.
-- ============================================================

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
