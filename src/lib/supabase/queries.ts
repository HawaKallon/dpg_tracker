import { createClient } from '@/lib/supabase/server';
import type {
  ActivityWithRelations,
  DashboardSummary,
  DashboardSummaryCompare,
  Location,
  SubProject,
  Category,
  SubCategory,
} from '@/types/database';

export async function getYears(): Promise<number[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('v_years').select('event_year');
  const years = (data ?? []).map((r) => r.event_year as number);
  if (years.length === 0) years.push(new Date().getFullYear());
  return years;
}

export async function getDashboardSummary(year?: number | null): Promise<DashboardSummary> {
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('by_sub_project', { p_year: year ?? null });
  if (error || !data) return [];
  return data as SubProjectBreakdown[];
}

export type MonthlyPoint = { month: string; total_participants: number; activity_count: number };

export async function getByMonth(year?: number | null): Promise<MonthlyPoint[]> {
  const supabase = await createClient();
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
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('by_location', { p_year: year ?? null });
  if (error || !data) return [];
  return data as LocationBreakdown[];
}

export type ActivityFilters = {
  sub_project_id?: string | null;
  location_id?: string | null;
  date_from?: string | null;
  date_to?: string | null;
};

export async function getRecentActivities(
  year?: number | null,
  limit = 12,
  filters: ActivityFilters = {}
): Promise<ActivityWithRelations[]> {
  const supabase = await createClient();
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
  if (filters.date_from) q = q.gte('activity_date', filters.date_from);
  if (filters.date_to) q = q.lte('activity_date', filters.date_to);
  const { data, error } = await q
    .order('activity_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as unknown as ActivityWithRelations[];
}

export async function getActivityById(id: string): Promise<ActivityWithRelations | null> {
  const supabase = await createClient();
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
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('sub_projects')
    .select('*')
    .order('display_order')
    .order('name');
  if (error || !data) return [];
  return data as SubProject[];
}

export async function getCategories(subProjectId?: string): Promise<Category[]> {
  const supabase = await createClient();
  let q = supabase.from('categories').select('*').order('name');
  if (subProjectId) q = q.eq('sub_project_id', subProjectId);
  const { data, error } = await q;
  if (error || !data) return [];
  return data as Category[];
}

export async function getSubCategories(categoryId?: string): Promise<SubCategory[]> {
  const supabase = await createClient();
  let q = supabase.from('sub_categories').select('*').order('name');
  if (categoryId) q = q.eq('category_id', categoryId);
  const { data, error } = await q;
  if (error || !data) return [];
  return data as SubCategory[];
}

export async function getLocations(): Promise<Location[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('locations').select('*').order('name');
  if (error || !data) return [];
  return data as Location[];
}

// ============================================================
// Detail-page queries (Phase 2)
// ============================================================

export async function getLocationBySlug(slug: string): Promise<Location | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error || !data) return null;
  return data as Location;
}

export async function getSubProjectBySlug(slug: string): Promise<SubProject | null> {
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
