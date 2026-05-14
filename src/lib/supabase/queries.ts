import { cacheLife, cacheTag } from 'next/cache';
import { createClient, createPublicClient } from '@/lib/supabase/server';
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

export type SubProjectBreakdown = {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  total_participants: number;
  male: number;
  female: number;
  activity_count: number;
};

export async function getBySubProject(year?: number | null): Promise<SubProjectBreakdown[]> {
  'use cache';
  cacheTag('dashboard', `dashboard:year:${year ?? 'all'}`);
  cacheLife('hours');
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc('by_sub_project', { p_year: year ?? null });
  if (error || !data) return [];
  return data as SubProjectBreakdown[];
}

export type MonthlyPoint = { month: string; total_participants: number; activity_count: number };

export async function getByMonth(year?: number | null): Promise<MonthlyPoint[]> {
  'use cache';
  cacheTag('dashboard', `dashboard:year:${year ?? 'all'}`);
  cacheLife('hours');
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc('by_month', { p_year: year ?? null });
  if (error || !data) return [];
  return data as MonthlyPoint[];
}

export type LocationBreakdown = {
  id: string;
  name: string;
  slug: string;
  type: string;
  total_participants: number;
  male: number;
  female: number;
  activity_count: number;
};

export async function getByLocation(year?: number | null): Promise<LocationBreakdown[]> {
  'use cache';
  cacheTag('dashboard', `dashboard:year:${year ?? 'all'}`);
  cacheLife('hours');
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc('by_location', { p_year: year ?? null });
  if (error || !data) return [];
  return data as LocationBreakdown[];
}

export type ActivityFilters = {
  sub_project_id?: string | null;
  location_id?: string | null;
  month?: number | null;     // 1–12; combined with the page-level year
  q?: string | null;         // free-text search on notes
  partner?: string | null;
};

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

export type LocationSummary = {
  total_participants: number;
  total_male: number;
  total_female: number;
  total_reach: number;
  activity_count: number;
  sub_project_count: number;
};

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
  if (error || !data) {
    return {
      total_participants: 0,
      total_male: 0,
      total_female: 0,
      total_reach: 0,
      activity_count: 0,
      sub_project_count: 0,
    };
  }
  return data as LocationSummary;
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
  if (error || !data) return [];
  return data as MonthlyPoint[];
}

export type MixSlice = {
  id: string;
  name: string;
  slug: string;
  total_participants: number;
  activity_count: number;
};

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
  if (error || !data) return [];
  return data as MixSlice[];
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

export type SubProjectSummary = {
  total_participants: number;
  total_male: number;
  total_female: number;
  total_reach: number;
  activity_count: number;
  location_count: number;
};

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

export type LocationMapPoint = {
  id: string;
  name: string;
  slug: string;
  type: string;
  lat: number;
  lng: number;
  partner_type: string | null;
  total_participants: number;
  activity_count: number;
};

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

export type PartnerSummaryRow = {
  partner: string;
  activity_count: number;
  total_participants: number;
  total_reach: number;
  sub_projects: string[] | null;
  last_activity_date: string | null;
};

export async function getPartnersSummary(year?: number | null): Promise<PartnerSummaryRow[]> {
  'use cache';
  cacheTag('partners', `partners:year:${year ?? 'all'}`);
  cacheLife('hours');
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc('partners_summary', { p_year: year ?? null });
  if (error || !data) return [];
  return data as PartnerSummaryRow[];
}

export type TopMoverRow = {
  id: string;
  name: string;
  slug: string;
  current_value: number;
  prior_value: number;
  delta_pct: number | null;
};

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
