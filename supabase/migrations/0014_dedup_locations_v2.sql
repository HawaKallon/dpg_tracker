-- Idempotent, name-based location dedup for canonical short codes.
--
-- 0013 merged a known set of UUIDs by hand. This migration generalizes to any
-- row whose name matches one of the canonical-anchor patterns, so that future
-- duplicates created via the admin UI (before 4b ships) or via spreadsheet
-- imports are also collapsed.
--
-- Canonical anchors:
--   FBC   ← any row whose name = 'FBC' (case-insensitive) OR contains
--           'fourah bay college' (incl. typos like 'Learningg').
--   LUCT  ← any row whose name = 'LUCT' (case-insensitive) OR contains
--           'limkokwing'.
--
-- For each anchor:
--   1. Pick the canonical row. Prefer the row whose name = the short code;
--      otherwise the row with the most activities. If no row has the short
--      code, rename the canonical row to it.
--   2. Reassign activities.location_id from every other matching row to the
--      canonical row.
--   3. Delete the now-orphaned matching rows.
--
-- Re-running this migration is safe: if only the canonical row remains for an
-- anchor, no updates fire and no deletes happen.
--
-- Extending: add another row to the `anchors` table inside the DO block.

do $$
declare
  anchor record;
  canonical_id uuid;
begin
  -- Anchor table: (short_code, where-clause as text). Keep in lockstep with
  -- src/lib/utils/canonical-location.ts ALIAS_MAP.
  for anchor in
    select * from (values
      ('FBC',  '(lower(name) = ''fbc'' or lower(name) like ''%fourah bay college%'')'),
      ('LUCT', '(lower(name) = ''luct'' or lower(name) like ''%limkokwing%'')')
    ) as t(short_code, predicate)
  loop
    -- Pick canonical: row whose name = short code, else row with most activities.
    execute format($f$
      select coalesce(
        (select id from public.locations where lower(name) = lower(%L) limit 1),
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
    $f$, anchor.short_code, anchor.predicate)
    into canonical_id;

    -- If nothing matches at all, skip this anchor.
    continue when canonical_id is null;

    -- Force the canonical row's name to the short code so future inserts can
    -- find it via case-insensitive lookup. Idempotent.
    update public.locations
       set name = anchor.short_code
     where id = canonical_id
       and name <> anchor.short_code;

    -- Reassign activities from every other matching row to canonical.
    execute format($f$
      update public.activities
         set location_id = %L
       where location_id in (
         select id from public.locations
          where %s
            and id <> %L
       )
    $f$, canonical_id, anchor.predicate, canonical_id);

    -- Delete the now-orphaned duplicate location rows.
    execute format($f$
      delete from public.locations
       where %s
         and id <> %L
    $f$, anchor.predicate, canonical_id);
  end loop;
end$$;
