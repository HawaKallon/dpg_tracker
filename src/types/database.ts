/**
 * Tiptap document JSON. Kept structural so this module doesn't depend on @tiptap/core.
 * PR B (editor stack) aliases this to JSONContent from @tiptap/core.
 */
export type RichTextDoc = {
  type: string;
  content?: unknown[];
  [key: string]: unknown;
};

export type SubProject = {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
  description: RichTextDoc | null;
  hero_image_url: string | null;
  funder_name: string | null;
  funder_logo_url: string | null;
};

export type Category = {
  id: string;
  sub_project_id: string;
  name: string;
};

export type SubCategory = {
  id: string;
  category_id: string;
  name: string;
};

export type Location = {
  id: string;
  name: string;
  type: 'university' | 'hub' | 'online' | 'other';
  region: string | null;
  slug: string;
  description: RichTextDoc | null;
  logo_url: string | null;
  website_url: string | null;
  lat: number | null;
  lng: number | null;
  partner_type: string | null;
  first_active_date: string | null;
};

export type Activity = {
  id: string;
  sub_project_id: string;
  category_id: string | null;
  sub_category_id: string | null;
  location_id: string | null;
  event_year: number;
  activity_date: string | null;
  month_label: string | null;
  male_count: number | null;
  female_count: number | null;
  total_count: number | null;
  reach: number | null;
  notes: string | null;
  discourse_url: string | null;
  data_source: string | null;
  outcomes: RichTextDoc | null;
  highlights: string | null;
  media_urls: string[];
  partner_orgs: string[];
  age_bands: string[];
  roles: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ActivityWithRelations = Activity & {
  sub_project: Pick<SubProject, 'id' | 'name' | 'slug'> | null;
  category: Pick<Category, 'id' | 'name'> | null;
  sub_category: Pick<SubCategory, 'id' | 'name'> | null;
  location: Pick<Location, 'id' | 'name' | 'type' | 'slug'> | null;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'viewer';
};

export type AuditLog = {
  id: string;
  table_name: string;
  row_id: string;
  action: 'insert' | 'update' | 'delete';
  actor_id: string | null;
  actor_email: string | null;
  diff: Record<string, unknown>;
  created_at: string;
};

export type DashboardSummary = {
  total_participants: number;
  total_male: number;
  total_female: number;
  total_reach: number;
  activity_count: number;
  location_count: number;
};

export type DashboardSummaryCompare = DashboardSummary & {
  prior_participants: number;
  prior_male: number;
  prior_female: number;
  prior_reach: number;
  prior_activity_count: number;
  prior_location_count: number;
};

export type DemographicsTaxonomyItem = {
  id: string;
  kind: 'age_band' | 'role';
  value: string;
  display_order: number;
};

