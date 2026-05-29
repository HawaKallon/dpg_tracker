-- Phase 3 — Activity demographics + Server-Action rate limiting.
-- 1. Adds age_bands / roles tag arrays to activities.
-- 2. Creates a controlled demographics_taxonomy lookup so admin chip pickers
--    don't drift into freeform chaos.
-- 3. Adds rate_limits + check_rate_limit() for the admin Server Actions.
-- Apply after 0011.

-- ============================================================
-- Activity demographics
-- ============================================================

alter table public.activities
  add column if not exists age_bands text[] not null default '{}',
  add column if not exists roles     text[] not null default '{}';

-- ============================================================
-- Demographics taxonomy
-- ============================================================

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

-- Seed common values for Sierra Leone / DPG context.
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
-- Rate limits (per-user, per-bucket, fixed window)
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

-- No client access. The Server Actions reach this only through check_rate_limit()
-- which is security definer. Block everything by default.
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
  -- Snap "now" to the floor of the current window.
  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.rate_limits (user_id, bucket, window_start, count)
  values (p_user_id, p_bucket, v_window_start, 1)
  on conflict (user_id, bucket, window_start)
    do update set count = public.rate_limits.count + 1
  returning count into v_count;

  -- Opportunistic cleanup: drop rows older than 1h. Cheap because of the index.
  delete from public.rate_limits where window_start < now() - interval '1 hour';

  return v_count <= p_max;
end;
$$;

revoke all on function public.check_rate_limit(uuid, text, int, int) from public;
grant execute on function public.check_rate_limit(uuid, text, int, int) to authenticated, service_role;
