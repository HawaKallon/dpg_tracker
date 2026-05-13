'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/security/rate-limit';

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  await rateLimit(user.id, 'lookup:write', { max: 40 });
  return supabase;
}

// ---- Sub-projects ----
export async function createSubProject(formData: FormData) {
  const supabase = await requireAdmin();
  const name = String(formData.get('name') ?? '').trim();
  const display_order = Number(formData.get('display_order') ?? 0);
  if (!name) return;
  await supabase.from('sub_projects').insert({ name, slug: slugify(name), display_order });
  updateTag('taxonomy:sub-projects');
  revalidatePath('/admin/lookups');
}

export async function deleteSubProject(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  await supabase.from('sub_projects').delete().eq('id', id);
  updateTag('taxonomy:sub-projects');
  revalidatePath('/admin/lookups');
}

// ---- Categories ----
export async function createCategory(formData: FormData) {
  const supabase = await requireAdmin();
  const sub_project_id = String(formData.get('sub_project_id') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  if (!sub_project_id || !name) return;
  await supabase.from('categories').insert({ sub_project_id, name });
  updateTag('taxonomy:categories');
  revalidatePath('/admin/lookups');
}

export async function deleteCategory(formData: FormData) {
  const supabase = await requireAdmin();
  await supabase.from('categories').delete().eq('id', String(formData.get('id') ?? ''));
  updateTag('taxonomy:categories');
  revalidatePath('/admin/lookups');
}

// ---- Sub-categories ----
export async function createSubCategory(formData: FormData) {
  const supabase = await requireAdmin();
  const category_id = String(formData.get('category_id') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  if (!category_id || !name) return;
  await supabase.from('sub_categories').insert({ category_id, name });
  updateTag('taxonomy:categories');
  revalidatePath('/admin/lookups');
}

export async function deleteSubCategory(formData: FormData) {
  const supabase = await requireAdmin();
  await supabase.from('sub_categories').delete().eq('id', String(formData.get('id') ?? ''));
  updateTag('taxonomy:categories');
  revalidatePath('/admin/lookups');
}

// ---- Locations ----
export async function createLocation(formData: FormData) {
  const supabase = await requireAdmin();
  const name = String(formData.get('name') ?? '').trim();
  const type = String(formData.get('type') ?? 'other');
  const region = String(formData.get('region') ?? '').trim() || null;
  if (!name) return;
  await supabase.from('locations').insert({ name, type, region });
  updateTag('taxonomy:locations');
  revalidatePath('/admin/lookups');
}

export async function deleteLocation(formData: FormData) {
  const supabase = await requireAdmin();
  await supabase.from('locations').delete().eq('id', String(formData.get('id') ?? ''));
  updateTag('taxonomy:locations');
  revalidatePath('/admin/lookups');
}
