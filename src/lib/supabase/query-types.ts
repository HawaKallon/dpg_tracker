/** Shared query result types — safe to import from client components. */

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

export type MonthlyPoint = {
  month: string;
  total_participants: number;
  activity_count: number;
};

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

export type ActivityFilters = {
  sub_project_id?: string | null;
  location_id?: string | null;
  month?: number | null;
  q?: string | null;
  partner?: string | null;
};

export type LocationSummary = {
  total_participants: number;
  total_male: number;
  total_female: number;
  total_reach: number;
  activity_count: number;
  sub_project_count: number;
};

export type MixSlice = {
  id: string;
  name: string;
  slug: string;
  total_participants: number;
  activity_count: number;
};

export type SubProjectSummary = {
  total_participants: number;
  total_male: number;
  total_female: number;
  total_reach: number;
  activity_count: number;
  location_count: number;
};

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

export type PartnerSummaryRow = {
  partner: string;
  activity_count: number;
  total_participants: number;
  total_reach: number;
  sub_projects: string[] | null;
  last_activity_date: string | null;
};

export type TopMoverRow = {
  id: string;
  name: string;
  slug: string;
  current_value: number;
  prior_value: number;
  delta_pct: number | null;
};
