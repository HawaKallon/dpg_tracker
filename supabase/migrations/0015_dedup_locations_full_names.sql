-- Merge location aliases and normalize to official full university names.
-- Replaces short-code canonicals (FBC, LUCT) from 0014 with full names.
-- Idempotent: safe to re-run.

do $$
declare
  anchor record;
  canonical_id uuid;
begin
  for anchor in
    select * from (values
      (
        'Fourah Bay College',
        '(lower(name) = ''fbc'' or lower(name) like ''%fourah bay college%'')'
      ),
      (
        'Limkokwing University of Creative Technology',
        '(lower(name) = ''luct'' or lower(name) like ''%limkokwing%'')'
      )
    ) as t(full_name, predicate)
  loop
    -- Prefer row already named with the full official name; else busiest match.
    execute format($f$
      select coalesce(
        (
          select id from public.locations
           where lower(trim(name)) = lower(%L)
           limit 1
        ),
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
    $f$, anchor.full_name, anchor.predicate)
    into canonical_id;

    continue when canonical_id is null;

    update public.locations
       set name = anchor.full_name
     where id = canonical_id
       and name is distinct from anchor.full_name;

    execute format($f$
      update public.activities
         set location_id = %L
       where location_id in (
         select id from public.locations
          where %s
            and id <> %L
       )
    $f$, canonical_id, anchor.predicate, canonical_id);

    execute format($f$
      delete from public.locations
       where %s
         and id <> %L
    $f$, anchor.predicate, canonical_id);
  end loop;
end$$;
