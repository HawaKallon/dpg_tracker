-- DPG Tracker schema
-- Run this once against the Supabase project (SQL editor or `supabase db push`).

create extension if not exists "uuid-ossp";

-- ============================================================
-- Lookups
-- ============================================================

create table public.sub_projects (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null unique,
  slug          text not null unique,
  display_order int  not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create table public.categories (
  id             uuid primary key default uuid_generate_v4(),
  sub_project_id uuid not null references public.sub_projects(id) on delete cascade,
  name           text not null,
  created_at     timestamptz not null default now(),
  unique (sub_project_id, name)
);

create table public.sub_categories (
  id          uuid primary key default uuid_generate_v4(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),
  unique (category_id, name)
);

create table public.locations (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null unique,
  type       text not null default 'other' check (type in ('university','hub','online','other')),
  region     text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Activities (fact table)
-- ============================================================

create table public.activities (
  id              uuid primary key default uuid_generate_v4(),
  sub_project_id  uuid not null references public.sub_projects(id),
  category_id     uuid references public.categories(id),
  sub_category_id uuid references public.sub_categories(id),
  location_id     uuid references public.locations(id),
  activity_date   date,
  month_label     text,
  male_count      int check (male_count >= 0),
  female_count    int check (female_count >= 0),
  total_count     int check (total_count >= 0),
  reach           int check (reach >= 0),
  notes           text,
  discourse_url   text,
  data_source     text,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index activities_sub_project_idx on public.activities(sub_project_id);
create index activities_location_idx    on public.activities(location_id);
create index activities_date_idx        on public.activities(activity_date);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger activities_set_updated_at
  before update on public.activities
  for each row execute function public.set_updated_at();

-- ============================================================
-- Profiles (mirrors auth.users)
-- ============================================================

create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  full_name  text,
  role       text not null default 'admin' check (role in ('admin','viewer')),
  created_at timestamptz not null default now()
);

-- Auto-create a profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'admin'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Audit log
-- ============================================================

create table public.audit_log (
  id           uuid primary key default uuid_generate_v4(),
  table_name   text not null,
  row_id       uuid not null,
  action       text not null check (action in ('insert','update','delete')),
  actor_id     uuid,
  actor_email  text,
  diff         jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create index audit_log_created_at_idx on public.audit_log(created_at desc);
create index audit_log_table_row_idx  on public.audit_log(table_name, row_id);

create or replace function public.log_audit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_actor_id    uuid := auth.uid();
  v_actor_email text;
  v_diff        jsonb;
  v_row_id      uuid;
begin
  if v_actor_id is not null then
    select email into v_actor_email from auth.users where id = v_actor_id;
  end if;

  if tg_op = 'INSERT' then
    v_diff := to_jsonb(new);
    v_row_id := new.id;
  elsif tg_op = 'UPDATE' then
    v_diff := jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new));
    v_row_id := new.id;
  elsif tg_op = 'DELETE' then
    v_diff := to_jsonb(old);
    v_row_id := old.id;
  end if;

  insert into public.audit_log (table_name, row_id, action, actor_id, actor_email, diff)
  values (tg_table_name, v_row_id, lower(tg_op), v_actor_id, v_actor_email, v_diff);

  if tg_op = 'DELETE' then
    return old;
  else
    return new;
  end if;
end $$;

create trigger activities_audit
  after insert or update or delete on public.activities
  for each row execute function public.log_audit();

-- ============================================================
-- Dashboard summary view
-- ============================================================

create or replace view public.v_dashboard_summary as
select
  coalesce(sum(total_count), 0)::int  as total_participants,
  coalesce(sum(male_count), 0)::int   as total_male,
  coalesce(sum(female_count), 0)::int as total_female,
  coalesce(sum(reach), 0)::int        as total_reach,
  count(*)::int                       as activity_count,
  count(distinct location_id)::int    as location_count
from public.activities;

create or replace view public.v_by_sub_project as
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
left join public.activities a on a.sub_project_id = sp.id
group by sp.id, sp.name, sp.slug, sp.display_order
order by sp.display_order, sp.name;

create or replace view public.v_by_month as
select
  to_char(coalesce(activity_date, date_trunc('month', created_at)::date), 'YYYY-MM') as month,
  coalesce(sum(total_count), 0)::int as total_participants,
  count(*)::int                       as activity_count
from public.activities
group by 1
order by 1;

create or replace view public.v_by_location as
select
  l.id,
  l.name,
  l.type,
  coalesce(sum(a.total_count), 0)::int as total_participants,
  count(a.id)::int                     as activity_count
from public.locations l
left join public.activities a on a.location_id = l.id
group by l.id, l.name, l.type
order by total_participants desc;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.sub_projects   enable row level security;
alter table public.categories     enable row level security;
alter table public.sub_categories enable row level security;
alter table public.locations      enable row level security;
alter table public.activities     enable row level security;
alter table public.profiles       enable row level security;
alter table public.audit_log      enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Public read for lookups + activities
create policy "lookups public read sub_projects"   on public.sub_projects   for select using (true);
create policy "lookups public read categories"     on public.categories     for select using (true);
create policy "lookups public read sub_categories" on public.sub_categories for select using (true);
create policy "lookups public read locations"      on public.locations      for select using (true);
create policy "activities public read"             on public.activities     for select using (true);

-- Admin write on lookups + activities
create policy "admin write sub_projects"   on public.sub_projects   for all using (is_admin()) with check (is_admin());
create policy "admin write categories"     on public.categories     for all using (is_admin()) with check (is_admin());
create policy "admin write sub_categories" on public.sub_categories for all using (is_admin()) with check (is_admin());
create policy "admin write locations"      on public.locations      for all using (is_admin()) with check (is_admin());
create policy "admin write activities"     on public.activities     for all using (is_admin()) with check (is_admin());

-- Profiles
create policy "profiles self read" on public.profiles for select using (auth.uid() = id or is_admin());
create policy "profiles self update" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Audit: admin read only; inserts go through trigger (security definer)
create policy "audit admin read" on public.audit_log for select using (is_admin());
