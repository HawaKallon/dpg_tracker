-- Fix Supabase "Security Definer View" lint on public.v_years.
-- security_invoker makes the view enforce the querying user's RLS/permissions
-- instead of the view owner's. Safe because public.activities already has a
-- public-read RLS policy ("activities public read" for select using (true)).
create or replace view public.v_years
with (security_invoker = true)
as
select distinct event_year
from public.activities
where event_year is not null
order by event_year desc;
