'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

function nullable(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function nullableInt(v: FormDataEntryValue | null): number | null {
  const s = nullable(v);
  if (s === null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return { supabase, user };
}

function payloadFromForm(formData: FormData) {
  const male = nullableInt(formData.get('male_count'));
  const female = nullableInt(formData.get('female_count'));
  const totalRaw = nullableInt(formData.get('total_count'));
  const total = totalRaw ?? (male !== null && female !== null ? male + female : null);

  const activity_date = nullable(formData.get('activity_date'));
  const yearFromDate = activity_date ? Number(activity_date.slice(0, 4)) : null;
  const yearFromForm = nullableInt(formData.get('event_year'));
  const event_year = yearFromForm ?? yearFromDate ?? new Date().getFullYear();

  return {
    sub_project_id: String(formData.get('sub_project_id') ?? ''),
    category_id: nullable(formData.get('category_id')),
    sub_category_id: nullable(formData.get('sub_category_id')),
    location_id: nullable(formData.get('location_id')),
    event_year,
    activity_date,
    month_label: nullable(formData.get('month_label')),
    male_count: male,
    female_count: female,
    total_count: total,
    reach: nullableInt(formData.get('reach')),
    notes: nullable(formData.get('notes')),
    discourse_url: nullable(formData.get('discourse_url')),
  };
}

export async function createActivity(formData: FormData) {
  const { supabase, user } = await requireAuth();
  const payload = payloadFromForm(formData);
  if (!payload.sub_project_id) throw new Error('Sub-project is required');

  const { error } = await supabase.from('activities').insert({ ...payload, created_by: user.id });
  if (error) throw new Error(error.message);

  revalidatePath('/admin/activities');
  revalidatePath('/');
  redirect('/admin/activities');
}

export async function updateActivity(id: string, formData: FormData) {
  const { supabase } = await requireAuth();
  const payload = payloadFromForm(formData);
  if (!payload.sub_project_id) throw new Error('Sub-project is required');

  const { error } = await supabase.from('activities').update(payload).eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/admin/activities');
  revalidatePath(`/admin/activities/${id}`);
  revalidatePath('/');
  redirect('/admin/activities');
}

export async function deleteActivity(formData: FormData) {
  const { supabase } = await requireAuth();
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  const { error } = await supabase.from('activities').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/activities');
  revalidatePath('/');
}

// ---- Inline creators (called from the activity form) ----

export async function createLocationInline(input: {
  name: string;
  type: 'university' | 'hub' | 'online' | 'other';
}): Promise<{ id: string; name: string; type: string }> {
  const { supabase } = await requireAuth();
  const name = input.name.trim();
  if (!name) throw new Error('Name is required');

  const { data: existing } = await supabase
    .from('locations')
    .select('id, name, type')
    .ilike('name', name)
    .maybeSingle();
  if (existing) return existing;

  const { data, error } = await supabase
    .from('locations')
    .insert({ name, type: input.type })
    .select('id, name, type')
    .single();
  if (error) throw new Error(error.message);

  revalidatePath('/admin/lookups');
  return data;
}

export async function createSubCategoryInline(input: {
  category_id: string;
  name: string;
}): Promise<{ id: string; category_id: string; name: string }> {
  const { supabase } = await requireAuth();
  const name = input.name.trim();
  if (!input.category_id) throw new Error('Pick a category first');
  if (!name) throw new Error('Name is required');

  const { data: existing } = await supabase
    .from('sub_categories')
    .select('id, category_id, name')
    .eq('category_id', input.category_id)
    .ilike('name', name)
    .maybeSingle();
  if (existing) return existing;

  const { data, error } = await supabase
    .from('sub_categories')
    .insert({ category_id: input.category_id, name })
    .select('id, category_id, name')
    .single();
  if (error) throw new Error(error.message);

  revalidatePath('/admin/lookups');
  return data;
}
