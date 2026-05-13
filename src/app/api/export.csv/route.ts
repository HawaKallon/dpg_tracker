import { NextResponse } from 'next/server';
import { getAllActivities } from '@/lib/supabase/queries';

const HEADERS = [
  'year',
  'date',
  'month_label',
  'sub_project',
  'category',
  'sub_category',
  'location',
  'male',
  'female',
  'total',
  'reach',
  'data_source',
  'discourse_url',
  'notes',
];

function csvEscape(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const yearParam = url.searchParams.get('year');
  const year = yearParam ? Number(yearParam) : null;

  const rows = await getAllActivities(year);
  const lines = [HEADERS.join(',')];
  for (const r of rows) {
    lines.push(
      [
        r.event_year,
        r.activity_date ?? '',
        r.month_label ?? '',
        r.sub_project?.name ?? '',
        r.category?.name ?? '',
        r.sub_category?.name ?? '',
        r.location?.name ?? '',
        r.male_count ?? '',
        r.female_count ?? '',
        r.total_count ?? '',
        r.reach ?? '',
        r.data_source ?? '',
        r.discourse_url ?? '',
        r.notes ?? '',
      ]
        .map(csvEscape)
        .join(',')
    );
  }
  const body = lines.join('\n');
  const suffix = year ? `-${year}` : '';
  return new NextResponse(body, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="dpg-tracker${suffix}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
