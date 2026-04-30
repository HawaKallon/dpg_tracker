/* Seed Supabase from "DPG by the Numbers.xlsx".
 *
 * Usage:
 *   1. Run migrations 0001 + 0002 in your Supabase project.
 *   2. Set SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local.
 *   3. From web/ run: npx tsx scripts/seed-from-xlsx.ts ../DPG\ by\ the\ Numbers.xlsx
 */
import 'dotenv/config';
import * as path from 'node:path';
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

type Row = Record<string, unknown>;

function s(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') return v.trim() || null;
  if (typeof v === 'number') return String(v);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v);
}

function n(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const x = typeof v === 'number' ? v : Number(String(v).replace(/[, ]/g, ''));
  return Number.isFinite(x) ? x : null;
}

async function ensureSubProject(name: string, order: number): Promise<string> {
  const { data: existing } = await supabase
    .from('sub_projects')
    .select('id')
    .eq('name', name)
    .maybeSingle();
  if (existing?.id) return existing.id;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const { data, error } = await supabase
    .from('sub_projects')
    .insert({ name, slug, display_order: order })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function ensureCategory(subProjectId: string, name: string): Promise<string> {
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('sub_project_id', subProjectId)
    .eq('name', name)
    .maybeSingle();
  if (existing?.id) return existing.id;
  const { data, error } = await supabase
    .from('categories')
    .insert({ sub_project_id: subProjectId, name })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function ensureSubCategory(categoryId: string, name: string): Promise<string> {
  const { data: existing } = await supabase
    .from('sub_categories')
    .select('id')
    .eq('category_id', categoryId)
    .eq('name', name)
    .maybeSingle();
  if (existing?.id) return existing.id;
  const { data, error } = await supabase
    .from('sub_categories')
    .insert({ category_id: categoryId, name })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function ensureLocation(name: string): Promise<string> {
  const { data: existing } = await supabase
    .from('locations')
    .select('id')
    .eq('name', name)
    .maybeSingle();
  if (existing?.id) return existing.id;
  const type = /universit|college|ipam|fbc|ebku|etu|njala|limkokwing/i.test(name)
    ? 'university'
    : /center|hub/i.test(name)
      ? 'hub'
      : /online|forms?/i.test(name)
        ? 'online'
        : 'other';
  const { data, error } = await supabase
    .from('locations')
    .insert({ name, type })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function main() {
  const file = process.argv[2] ?? path.resolve(__dirname, '../../DPG by the Numbers.xlsx');
  console.log(`Reading ${file}`);
  const wb = XLSX.readFile(file, { cellDates: true });
  const ws = wb.Sheets['Sheet1'];

  // Read as raw 2D array. Column layout (0-indexed) from the source sheet:
  //   0 Sub Projects | 1 Category | 2 Sub Category | 3 Location | 4 Notes |
  //   5 Month | 6 Male | 7 Female | 8 Total | 9 Reach | 10 Data Provided By
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: null,
    raw: true,
  });

  // Skip the two header rows (row 0 is "Sub Projects | Category | …",
  // row 1 is the "Male | Female | Total" sub-header).
  const dataRows = matrix.slice(2);
  console.log(`${dataRows.length} data rows in Sheet1`);

  const SUB_PROJECT_ORDER: Record<string, number> = {
    'Community of Practice': 1,
    'Academia': 2,
    'Policy': 3,
    'Pipeline': 4,
    'Bounty Platform': 5,
    'Learn2Earn': 6,
  };

  let curSubProject: string | null = null;
  let curCategory: string | null = null;

  let inserted = 0;
  let skipped = 0;

  for (const row of dataRows) {
    if (!Array.isArray(row) || row.length === 0) {
      skipped++;
      continue;
    }

    const sp = s(row[0]);
    if (sp) {
      // The "Total" footer row appears in column 5 (Month) — bail when we see it.
      if (sp.toLowerCase() === 'total') break;
      curSubProject = sp;
      // New sub-project resets the category carry-down.
      curCategory = null;
    }

    const cat = s(row[1]);
    if (cat) curCategory = cat;

    const subCat = s(row[2]);
    const location = s(row[3]);
    const notes = s(row[4]);
    const monthRaw = row[5];
    const month = s(monthRaw);
    const male = n(row[6]);
    const female = n(row[7]);
    const total = n(row[8]);
    const reach = n(row[9]);
    const dataSource = s(row[10]);

    if (!curSubProject || total === null) {
      skipped++;
      continue;
    }

    const subProjectId = await ensureSubProject(curSubProject, SUB_PROJECT_ORDER[curSubProject] ?? 99);
    const categoryId = curCategory ? await ensureCategory(subProjectId, curCategory) : null;
    const subCategoryId = subCat && categoryId ? await ensureSubCategory(categoryId, subCat) : null;
    const locationId = location ? await ensureLocation(location) : null;

    const activityDate =
      monthRaw instanceof Date ? (monthRaw as Date).toISOString().slice(0, 10) : null;

    const eventYear = activityDate
      ? Number(activityDate.slice(0, 4))
      : 2025; // legacy spreadsheet rows are 2025

    const { error } = await supabase.from('activities').insert({
      sub_project_id: subProjectId,
      category_id: categoryId,
      sub_category_id: subCategoryId,
      location_id: locationId,
      event_year: eventYear,
      activity_date: activityDate,
      month_label: !activityDate ? month : null,
      male_count: male,
      female_count: female,
      total_count: total,
      reach,
      notes,
      data_source: dataSource,
    });

    if (error) {
      console.error('Insert failed:', error.message, { curSubProject, location, total });
      skipped++;
      continue;
    }
    inserted++;
  }

  console.log(`Done. Inserted ${inserted}, skipped ${skipped}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
