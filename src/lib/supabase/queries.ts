import 'server-only';

import { cacheLife, cacheTag } from 'next/cache';
import { createClient, createPublicClient } from '@/lib/supabase/server';
import type {
  ActivityFilters,
  LocationBreakdown,
  LocationMapPoint,
  LocationSummary,
  MixSlice,
  MonthlyPoint,
  PartnerSummaryRow,
  SubProjectBreakdown,
  SubProjectSummary,
  TopMoverRow,
} from '@/lib/supabase/query-types';

export type {
  ActivityFilters,
  LocationBreakdown,
  LocationMapPoint,
  LocationSummary,
  MixSlice,
  MonthlyPoint,
  PartnerSummaryRow,
  SubProjectBreakdown,
  SubProjectSummary,
  TopMoverRow,
} from '@/lib/supabase/query-types';
import type {
  ActivityWithRelations,
  DashboardSummary,
  DashboardSummaryCompare,
  DemographicsTaxonomyItem,
  Location,
  SubProject,
  Category,
  SubCategory,
} from '@/types/database';

// ============================================================
// Cache tag schema
// ------------------------------------------------------------
// 'dashboard'                    — invalidated by any activity write
// `dashboard:year:${y}`          — invalidated by writes that touch year y
// 'taxonomy:sub-projects'        — sub_projects table writes
// 'taxonomy:categories'          — categories / sub_categories writes
// 'taxonomy:locations'           — locations table writes
// 'taxonomy:demographics'        — demographics_taxonomy writes
// `location:${slug}`             — that location's page data
// `sub-project:${slug}`          — that sub-project's page data
// `activity:${id}`               — that activity's page data
// 'partners'                     — partner aggregations
// ============================================================

export async function getYears(): Promise<number[]> {
  'use cache';
  cacheTag('dashboard');
  cacheLife('hours');
  const supabase = createPublicClient();
  const { data } = await supabase.from('v_years').select('event_year');
  const years = (data ?? []).map((r) => r.event_year as number);
  if (years.length === 0) years.push(new Date().getFullYear());
  return years;
}

export async function getDashboardSummary(year?: number | null): Promise<DashboardSummary> {
  'use cache';
  cacheTag('dashboard', `dashboard:year:${year ?? 'all'}`);
  cacheLife('hours');
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .rpc('dashboard_summary', { p_year: year ?? null })
    .single();
  if (error || !data) {
    return {
      total_participants: 0,
      total_male: 0,
      total_female: 0,
      total_reach: 0,
      activity_count: 0,
      location_count: 0,
    };
  }
  return data as DashboardSummary;
}

export async function getDashboardSummaryCompare(
  year: number
): Promise<DashboardSummaryCompare> {
  'use cache';
  cacheTag('dashboard', `dashboard:year:${year}`, `dashboard:year:${year - 1}`);
  cacheLife('hours');
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .rpc('dashboard_summary_compare', { p_year: year })
    .single();
  if (error || !data) {
    const fallback = await getDashboardSummary(year);
    return {
      ...fallback,
      prior_participants: 0,
      prior_male: 0,
      prior_female: 0,
      prior_reach: 0,
      prior_activity_count: 0,
      prior_location_count: 0,
    };
  }
  return data as DashboardSummaryCompare;
}

export async function getBySubProject(year?: number | null): Promise<SubProjectBreakdown[]> {
  'use cache';
  cacheTag('dashboard', `dashboard:year:${year ?? 'all'}`);
  cacheLife('hours');
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc('by_sub_project', { p_year: year ?? null });
  if (error || !data) return [];
  return data as SubProjectBreakdown[];
}

export async function getByMonth(year?: number | null): Promise<MonthlyPoint[]> {
  'use cache';
  cacheTag('dashboard', `dashboard:year:${year ?? 'all'}`);
  cacheLife('hours');
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc('by_month', { p_year: year ?? null });
  if (error || !data) return [];
  return data as MonthlyPoint[];
}

export async function getByLocation(year?: number | null): Promise<LocationBreakdown[]> {
  'use cache';
  cacheTag('dashboard', `dashboard:year:${year ?? 'all'}`);
  cacheLife('hours');
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc('by_location', { p_year: year ?? null });
  if (error || !data) return [];
  return data as LocationBreakdown[];
}

export async function getRecentActivities(
  year?: number | null,
  limit = 12,
  filters: ActivityFilters = {}
): Promise<ActivityWithRelations[]> {
  'use cache';
  cacheTag('dashboard', `dashboard:year:${year ?? 'all'}`);
  cacheLife('hours');
  const supabase = createPublicClient();
  let q = supabase
    .from('activities')
    .select(`
      *,
      sub_project:sub_projects(id, name, slug),
      category:categories(id, name),
      sub_category:sub_categories(id, name),
      location:locations(id, name, type, slug)
    `);
  if (year) q = q.eq('event_year', year);
  if (filters.sub_project_id) q = q.eq('sub_project_id', filters.sub_project_id);
  if (filters.location_id) q = q.eq('location_id', filters.location_id);
  if (filters.month && filters.month >= 1 && filters.month <= 12 && year) {
    const mm = String(filters.month).padStart(2, '0');
    const lastDay = new Date(year, filters.month, 0).getDate();
    q = q
      .gte('activity_date', `${year}-${mm}-01`)
      .lte('activity_date', `${year}-${mm}-${String(lastDay).padStart(2, '0')}`);
  }
  if (filters.q && filters.q.trim()) {
    const term = filters.q.trim().replace(/[%_]/g, '\\$&');
    q = q.ilike('notes', `%${term}%`);
  }
  if (filters.partner) q = q.contains('partner_orgs', [filters.partner]);
  const { data, error } = await q
    .order('activity_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as unknown as ActivityWithRelations[];
}

/**
 * Activities that have at least one photo OR a non-empty `highlights` quote —
 * used for the "Stories from the field" section on the home page. Hide-when-empty
 * is enforced at the page level (we just return what we have).
 */
export async function getStorySpotlight(
  year?: number | null,
  limit = 6
): Promise<ActivityWithRelations[]> {
  'use cache';
  cacheTag('dashboard', `dashboard:year:${year ?? 'all'}`);
  cacheLife('hours');
  const supabase = createPublicClient();
  let q = supabase
    .from('activities')
    .select(`
      *,
      sub_project:sub_projects(id, name, slug),
      category:categories(id, name),
      sub_category:sub_categories(id, name),
      location:locations(id, name, type, slug)
    `)
    .or('highlights.not.is.null,media_urls.not.eq.{}');
  if (year) q = q.eq('event_year', year);
  const { data, error } = await q
    .order('activity_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as unknown as ActivityWithRelations[];
}

export async function getActivityById(id: string): Promise<ActivityWithRelations | null> {
  'use cache';
  cacheTag(`activity:${id}`);
  cacheLife('hours');
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('activities')
    .select(
      `
      *,
      sub_project:sub_projects(id, name, slug),
      category:categories(id, name),
      sub_category:sub_categories(id, name),
      location:locations(id, name, type, slug)
    `
    )
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as ActivityWithRelations;
}

export async function getRelatedActivitiesByLocation(
  locationId: string,
  year: number,
  excludeId: string,
  limit = 6
): Promise<ActivityWithRelations[]> {
  'use cache';
  cacheTag(`dashboard:year:${year}`, `locationId:${locationId}`, `activity:${excludeId}`);
  cacheLife('hours');
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('activities')
    .select(
      `
      *,
      sub_project:sub_projects(id, name, slug),
      category:categories(id, name),
      sub_category:sub_categories(id, name),
      location:locations(id, name, type, slug)
    `
    )
    .eq('event_year', year)
    .eq('location_id', locationId)
    .neq('id', excludeId)
    .order('activity_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as unknown as ActivityWithRelations[];
}

export async function getRelatedActivitiesBySubProject(
  subProjectId: string,
  year: number,
  excludeId: string,
  limit = 6
): Promise<ActivityWithRelations[]> {
  'use cache';
  cacheTag(`dashboard:year:${year}`, `subProjectId:${subProjectId}`, `activity:${excludeId}`);
  cacheLife('hours');
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('activities')
    .select(
      `
      *,
      sub_project:sub_projects(id, name, slug),
      category:categories(id, name),
      sub_category:sub_categories(id, name),
      location:locations(id, name, type, slug)
    `
    )
    .eq('event_year', year)
    .eq('sub_project_id', subProjectId)
    .neq('id', excludeId)
    .order('activity_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as unknown as ActivityWithRelations[];
}

// Admin path — uses cookie-bound client for RLS / session, NOT cached.
export async function getAllActivities(year?: number | null): Promise<ActivityWithRelations[]> {
  const supabase = await createClient();
  let q = supabase.from('activities').select(`
    *,
    sub_project:sub_projects(id, name, slug),
    category:categories(id, name),
    sub_category:sub_categories(id, name),
    location:locations(id, name, type)
  `);
  if (year) q = q.eq('event_year', year);
  const { data, error } = await q
    .order('activity_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as unknown as ActivityWithRelations[];
}

export async function getSubProjects(): Promise<SubProject[]> {
  'use cache';
  cacheTag('taxonomy:sub-projects');
  cacheLife('hours');
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('sub_projects')
    .select('*')
    .order('display_order')
    .order('name');
  if (error || !data) return [];
  return data as SubProject[];
}

export async function getCategories(subProjectId?: string): Promise<Category[]> {
  'use cache';
  cacheTag('taxonomy:categories');
  cacheLife('hours');
  const supabase = createPublicClient();
  let q = supabase.from('categories').select('*').order('name');
  if (subProjectId) q = q.eq('sub_project_id', subProjectId);
  const { data, error } = await q;
  if (error || !data) return [];
  return data as Category[];
}

export async function getSubCategories(categoryId?: string): Promise<SubCategory[]> {
  'use cache';
  cacheTag('taxonomy:categories');
  cacheLife('hours');
  const supabase = createPublicClient();
  let q = supabase.from('sub_categories').select('*').order('name');
  if (categoryId) q = q.eq('category_id', categoryId);
  const { data, error } = await q;
  if (error || !data) return [];
  return data as SubCategory[];
}

export async function getLocations(): Promise<Location[]> {
  'use cache';
  cacheTag('taxonomy:locations');
  cacheLife('hours');
  const supabase = createPublicClient();
  const { data, error } = await supabase.from('locations').select('*').order('name');
  if (error || !data) return [];
  return data as Location[];
}

// ============================================================
// Detail-page queries (Phase 2)
// ============================================================

export async function getLocationBySlug(slug: string): Promise<Location | null> {
  'use cache';
  cacheTag('taxonomy:locations', `location:${slug}`);
  cacheLife('hours');
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error || !data) return null;
  return data as Location;
}

export async function getSubProjectBySlug(slug: string): Promise<SubProject | null> {
  'use cache';
  cacheTag('taxonomy:sub-projects', `sub-project:${slug}`);
  cacheLife('hours');
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('sub_projects')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error || !data) return null;
  return data as SubProject;
}

export async function getLocationHasGenderBreakdown(
  slug: string,
  year?: number | null
): Promise<boolean> {
  'use cache';
  cacheTag(`location:${slug}`, `location:${slug}:year:${year ?? 'all'}`);
  cacheLife('hours');
  const supabase = createPublicClient();
  const { data: loc } = await supabase
    .from('locations')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (!loc?.id) return false;

  let q = supabase
    .from('activities')
    .select('id')
    .eq('location_id', loc.id)
    .or('male_count.not.is.null,female_count.not.is.null')
    .limit(1);
  if (year) q = q.eq('event_year', year);
  const { data, error } = await q;
  if (error) return false;
  return (data?.length ?? 0) > 0;
}

export async function getLocationSummary(
  slug: string,
  year?: number | null
): Promise<LocationSummary> {
  'use cache';
  cacheTag(`location:${slug}`, `location:${slug}:year:${year ?? 'all'}`);
  cacheLife('hours');
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .rpc('location_summary', { p_slug: slug, p_year: year ?? null })
    .single();
  if (!error && data) return data as LocationSummary;

  // Fallback (e.g. RPC not deployed yet): compute directly from activities.
  const { data: loc } = await supabase
    .from('locations')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (!loc?.id) {
    return {
      total_participants: 0,
      total_male: 0,
      total_female: 0,
      total_reach: 0,
      activity_count: 0,
      sub_project_count: 0,
    };
  }

  let q = supabase
    .from('activities')
    .select('id,total_count,male_count,female_count,reach,sub_project_id')
    .eq('location_id', loc.id);
  if (year) q = q.eq('event_year', year);
  const { data: rows, error: rowsErr } = await q;
  if (rowsErr || !rows) {
    return {
      total_participants: 0,
      total_male: 0,
      total_female: 0,
      total_reach: 0,
      activity_count: 0,
      sub_project_count: 0,
    };
  }

  const seen = new Set<string>();
  let total_participants = 0;
  let total_male = 0;
  let total_female = 0;
  let total_reach = 0;
  type LocationSummaryRow = {
    total_count: number | null;
    male_count: number | null;
    female_count: number | null;
    reach: number | null;
    sub_project_id: string | null;
  };
  for (const r of rows as unknown as LocationSummaryRow[]) {
    total_participants += r.total_count ?? 0;
    total_male += r.male_count ?? 0;
    total_female += r.female_count ?? 0;
    total_reach += r.reach ?? 0;
    if (r.sub_project_id) seen.add(r.sub_project_id);
  }

  return {
    total_participants,
    total_male,
    total_female,
    total_reach,
    activity_count: rows.length,
    sub_project_count: seen.size,
  };
}

export async function getLocationMonthly(
  slug: string,
  year?: number | null
): Promise<MonthlyPoint[]> {
  'use cache';
  cacheTag(`location:${slug}`, `location:${slug}:year:${year ?? 'all'}`);
  cacheLife('hours');
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc('location_monthly', {
    p_slug: slug,
    p_year: year ?? null,
  });
  if (!error && data) return data as MonthlyPoint[];

  // Fallback: compute directly from activities.
  const { data: loc } = await supabase
    .from('locations')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (!loc?.id) return [];

  let q = supabase
    .from('activities')
    .select('activity_date,event_year,total_count')
    .eq('location_id', loc.id);
  if (year) q = q.eq('event_year', year);
  const { data: rows, error: rowsErr } = await q;
  if (rowsErr || !rows) return [];

  const byMonth = new Map<string, { total_participants: number; activity_count: number }>();
  type LocationMonthlyRow = {
    activity_date: string | null;
    event_year: number | null;
    total_count: number | null;
  };
  for (const r of rows as unknown as LocationMonthlyRow[]) {
    const dateLike = r.activity_date ?? (r.event_year ? `${r.event_year}-01-01` : null);
    if (!dateLike) continue;
    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const prev = byMonth.get(key) ?? { total_participants: 0, activity_count: 0 };
    prev.total_participants += r.total_count ?? 0;
    prev.activity_count += 1;
    byMonth.set(key, prev);
  }

  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, ...v }));
}

export async function getLocationSubProjectMix(
  slug: string,
  year?: number | null
): Promise<MixSlice[]> {
  'use cache';
  cacheTag(`location:${slug}`, `location:${slug}:year:${year ?? 'all'}`);
  cacheLife('hours');
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc('location_sub_project_mix', {
    p_slug: slug,
    p_year: year ?? null,
  });
  if (!error && data) return data as MixSlice[];

  // Fallback: compute directly from activities.
  const { data: loc } = await supabase
    .from('locations')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (!loc?.id) return [];

  let q = supabase
    .from('activities')
    .select(
      `
        total_count,
        sub_project:sub_projects(id, name, slug)
      `
    )
    .eq('location_id', loc.id);
  if (year) q = q.eq('event_year', year);
  const { data: rows, error: rowsErr } = await q;
  if (rowsErr || !rows) return [];

  const buckets = new Map<
    string,
    { id: string; name: string; slug: string; total_participants: number; activity_count: number }
  >();
  type LocationMixRow = {
    total_count: number | null;
    sub_project: { id: string; name: string; slug: string } | null;
  };
  for (const r of rows as unknown as LocationMixRow[]) {
    const sp = r.sub_project;
    if (!sp?.id) continue;
    const key = sp.id;
    const prev =
      buckets.get(key) ?? ({
        id: sp.id,
        name: sp.name,
        slug: sp.slug,
        total_participants: 0,
        activity_count: 0,
      } as const);
    buckets.set(key, {
      ...prev,
      total_participants: prev.total_participants + (r.total_count ?? 0),
      activity_count: prev.activity_count + 1,
    });
  }

  return [...buckets.values()]
    .filter((b) => b.activity_count > 0)
    .sort((a, b) => b.total_participants - a.total_participants);
}

export async function getActivitiesByLocation(
  slug: string,
  year?: number | null,
  limit = 12
): Promise<ActivityWithRelations[]> {
  'use cache';
  cacheTag(`location:${slug}`, `location:${slug}:year:${year ?? 'all'}`);
  cacheLife('hours');
  const supabase = createPublicClient();
  const { data: loc } = await supabase
    .from('locations')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (!loc) return [];
  let q = supabase
    .from('activities')
    .select(`
      *,
      sub_project:sub_projects(id, name, slug),
      category:categories(id, name),
      sub_category:sub_categories(id, name),
      location:locations(id, name, type, slug)
    `)
    .eq('location_id', loc.id);
  if (year) q = q.eq('event_year', year);
  const { data, error } = await q
    .order('activity_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as unknown as ActivityWithRelations[];
}

export async function getSubProjectSummary(
  slug: string,
  year?: number | null
): Promise<SubProjectSummary> {
  'use cache';
  cacheTag(`sub-project:${slug}`, `sub-project:${slug}:year:${year ?? 'all'}`);
  cacheLife('hours');
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .rpc('sub_project_summary', { p_slug: slug, p_year: year ?? null })
    .single();
  if (error || !data) {
    return {
      total_participants: 0,
      total_male: 0,
      total_female: 0,
      total_reach: 0,
      activity_count: 0,
      location_count: 0,
    };
  }
  return data as SubProjectSummary;
}

export async function getSubProjectMonthly(
  slug: string,
  year?: number | null
): Promise<MonthlyPoint[]> {
  'use cache';
  cacheTag(`sub-project:${slug}`, `sub-project:${slug}:year:${year ?? 'all'}`);
  cacheLife('hours');
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc('sub_project_monthly', {
    p_slug: slug,
    p_year: year ?? null,
  });
  if (error || !data) return [];
  return data as MonthlyPoint[];
}

export async function getSubProjectLocationMix(
  slug: string,
  year?: number | null
): Promise<MixSlice[]> {
  'use cache';
  cacheTag(`sub-project:${slug}`, `sub-project:${slug}:year:${year ?? 'all'}`);
  cacheLife('hours');
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc('sub_project_location_mix', {
    p_slug: slug,
    p_year: year ?? null,
  });
  if (error || !data) return [];
  return data as MixSlice[];
}

export async function getActivitiesBySubProject(
  slug: string,
  year?: number | null,
  limit = 12
): Promise<ActivityWithRelations[]> {
  'use cache';
  cacheTag(`sub-project:${slug}`, `sub-project:${slug}:year:${year ?? 'all'}`);
  cacheLife('hours');
  const supabase = createPublicClient();
  const { data: sp } = await supabase
    .from('sub_projects')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (!sp) return [];
  let q = supabase
    .from('activities')
    .select(`
      *,
      sub_project:sub_projects(id, name, slug),
      category:categories(id, name),
      sub_category:sub_categories(id, name),
      location:locations(id, name, type, slug)
    `)
    .eq('sub_project_id', sp.id);
  if (year) q = q.eq('event_year', year);
  const { data, error } = await q
    .order('activity_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as unknown as ActivityWithRelations[];
}

// ============================================================
// Phase 3 — Map, partners, report, demographics
// ============================================================

export async function getLocationsWithCoords(year?: number | null): Promise<LocationMapPoint[]> {
  'use cache';
  cacheTag('taxonomy:locations', 'dashboard', `dashboard:year:${year ?? 'all'}`);
  cacheLife('hours');
  const supabase = createPublicClient();
  const [{ data: locs }, byLocRes] = await Promise.all([
    supabase
      .from('locations')
      .select('id, name, slug, type, lat, lng, partner_type')
      .not('lat', 'is', null)
      .not('lng', 'is', null),
    supabase.rpc('by_location', { p_year: year ?? null }),
  ]);
  if (!locs) return [];
  const byLoc = (byLocRes.data ?? []) as LocationBreakdown[];
  const totals = new Map(byLoc.map((b) => [b.id, b]));
  return locs
    .filter((l) => l.lat !== null && l.lng !== null)
    .map((l) => {
      const t = totals.get(l.id);
      return {
        id: l.id,
        name: l.name,
        slug: l.slug,
        type: l.type,
        lat: Number(l.lat),
        lng: Number(l.lng),
        partner_type: l.partner_type,
        total_participants: t?.total_participants ?? 0,
        activity_count: t?.activity_count ?? 0,
      };
    });
}

export async function getPartnersSummary(year?: number | null): Promise<PartnerSummaryRow[]> {
  'use cache';
  cacheTag('partners', `partners:year:${year ?? 'all'}`);
  cacheLife('hours');
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc('partners_summary', { p_year: year ?? null });
  if (error || !data) return [];
  return data as PartnerSummaryRow[];
}

export async function getReportTopMovers(
  year: number,
  dim: 'sub_project' | 'location'
): Promise<TopMoverRow[]> {
  'use cache';
  cacheTag('dashboard', `dashboard:year:${year}`, `dashboard:year:${year - 1}`);
  cacheLife('hours');
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc('report_top_movers', {
    p_year: year,
    p_dim: dim,
  });
  if (error || !data) return [];
  return data as TopMoverRow[];
}

export async function getDemographicsTaxonomy(): Promise<DemographicsTaxonomyItem[]> {
  'use cache';
  cacheTag('taxonomy:demographics');
  cacheLife('hours');
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('demographics_taxonomy')
    .select('id, kind, value, display_order')
    .order('kind')
    .order('display_order')
    .order('value');
  if (error || !data) return [];
  return data as DemographicsTaxonomyItem[];
}
