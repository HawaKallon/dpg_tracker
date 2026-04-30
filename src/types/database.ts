export type SubProject = {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  is_active: boolean;
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
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ActivityWithRelations = Activity & {
  sub_project: Pick<SubProject, 'id' | 'name' | 'slug'> | null;
  category: Pick<Category, 'id' | 'name'> | null;
  sub_category: Pick<SubCategory, 'id' | 'name'> | null;
  location: Pick<Location, 'id' | 'name' | 'type'> | null;
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
