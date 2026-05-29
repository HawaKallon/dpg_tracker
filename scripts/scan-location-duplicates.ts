/* Read-only scan: list all locations, group by likely-duplicate names.
 * Usage: npx tsx scripts/scan-location-duplicates.ts
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

function normalise(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\b(college|university|campus|institute|polytechnic|of|the|sl|sierra leone)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

type Loc = {
  id: string;
  name: string;
  type: string;
  region: string | null;
};

async function main() {
  const { data: locs, error } = await supabase
    .from('locations')
    .select('id, name, type, region')
    .order('name');
  if (error) {
    console.error('Query failed:', error.message);
    process.exit(1);
  }
  if (!locs) {
    console.log('No locations found.');
    return;
  }

  console.log(`\nTotal locations: ${locs.length}\n`);

  const byType: Record<string, Loc[]> = {};
  for (const l of locs as Loc[]) {
    (byType[l.type] ||= []).push(l);
  }

  console.log('By type:');
  for (const [t, list] of Object.entries(byType)) {
    console.log(`  ${t}: ${list.length}`);
  }
  console.log('');

  console.log('=== UNIVERSITIES ===');
  for (const u of byType.university || []) {
    console.log(`  [${u.id.slice(0, 8)}] ${u.name}  (region=${u.region ?? '-'})`);
  }
  console.log('');

  const groups = new Map<string, Loc[]>();
  for (const l of locs as Loc[]) {
    const key = normalise(l.name);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(l);
  }

  console.log('=== LIKELY DUPLICATE GROUPS (fuzzy name match) ===');
  let foundDupes = false;
  for (const [key, list] of groups) {
    if (list.length > 1) {
      foundDupes = true;
      console.log(`\n  Key: "${key}"`);
      for (const l of list) {
        console.log(`    - [${l.id}] "${l.name}" (type=${l.type})`);
      }
    }
  }
  if (!foundDupes) {
    console.log('  (none detected by fuzzy match)');
  }

  console.log('\n=== ACTIVITY COUNT PER LOCATION ===');
  const { data: counts, error: cErr } = await supabase
    .from('activities')
    .select('location_id', { count: 'exact', head: false });
  if (cErr) {
    console.error('Activity count query failed:', cErr.message);
  } else if (counts) {
    const tally = new Map<string, number>();
    for (const row of counts as Array<{ location_id: string | null }>) {
      if (!row.location_id) continue;
      tally.set(row.location_id, (tally.get(row.location_id) ?? 0) + 1);
    }
    for (const u of byType.university || []) {
      console.log(`  ${u.name}: ${tally.get(u.id) ?? 0} activities`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
