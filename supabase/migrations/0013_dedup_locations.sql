-- Deduplicate universities: merge name variants into canonical rows.
-- Apply AFTER 0007 (slug column must exist) in the Supabase SQL editor or via `supabase db push`.
--
-- Merge plan (decided 2026-05):
--   Fourah Bay College (9217952f-…)          ← merges:
--       73f71164-…  "Fourah Bay College Digital Learningg Hub"
--       425881b9-…  "Fourah Bay College Outreach"
--   Njala University - Bo Campus (1a6c499d-…) ← merges:
--       6d9042cb-…  "Njala - Bo Campus"
--   Limkokwing University (b32daec4-…)        ← merges:
--       65b3094a-…  "MoCTI + Limkokwing University"
--
-- All FK refs on activities.location_id are reassigned, then the duplicate
-- rows are deleted. Re-running this migration is a no-op (the duplicate IDs
-- no longer exist after first apply).

-- ============================================================
-- 1. Reassign activities to canonical locations
-- ============================================================

update public.activities
   set location_id = '9217952f-0b16-4a7d-a04e-74ae09b55416'  -- Fourah Bay College
 where location_id in (
   '73f71164-8e53-4619-ae90-99a958fb7a56',   -- Digital Learningg Hub
   '425881b9-cef4-4386-b887-db1c60ea0a09'    -- Outreach
 );

update public.activities
   set location_id = '1a6c499d-2eea-45cf-869b-36bb690b8bf3'  -- Njala University - Bo Campus
 where location_id = '6d9042cb-c083-4757-9c97-8aeab2b1fd67'; -- Njala - Bo Campus

update public.activities
   set location_id = 'b32daec4-2c32-4db4-99ad-f35c0313d8b3'  -- Limkokwing University
 where location_id = '65b3094a-4d33-4c17-969f-4b222c0f6d1c'; -- MoCTI + Limkokwing

-- ============================================================
-- 2. Delete the duplicate location rows
-- ============================================================

delete from public.locations
 where id in (
   '73f71164-8e53-4619-ae90-99a958fb7a56',
   '425881b9-cef4-4386-b887-db1c60ea0a09',
   '6d9042cb-c083-4757-9c97-8aeab2b1fd67',
   '65b3094a-4d33-4c17-969f-4b222c0f6d1c'
 );
