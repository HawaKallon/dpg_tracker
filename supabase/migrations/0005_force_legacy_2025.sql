-- All rows seeded from the original Google Sheet are 2025 data,
-- even where a stray Excel-parsed date said otherwise.
update public.activities
set event_year = 2025
where created_at < now();
