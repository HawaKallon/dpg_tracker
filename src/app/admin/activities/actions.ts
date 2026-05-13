'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { uploadActivityMedia } from '@/lib/supabase/storage';
import { rateLimit } from '@/lib/security/rate-limit';
import type { RichTextDoc } from '@/types/database';

function invalidateActivity(
  activityId: string,
  year: number | null,
  slugs?: { location?: string | null; subProject?: string | null }
) {
  updateTag('dashboard');
  updateTag('partners');
  updateTag(`activity:${activityId}`);
  if (year) updateTag(`dashboard:year:${year}`);
  if (slugs?.location) updateTag(`location:${slugs.location}`);
  if (slugs?.subProject) updateTag(`sub-project:${slugs.subProject}`);
}

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

function parseRichText(v: FormDataEntryValue | null): RichTextDoc | null {
  const s = nullable(v);
  if (!s) return null;
  try {
    const parsed = JSON.parse(s) as RichTextDoc;
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.content) && parsed.content.length > 0) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function stringArray(values: FormDataEntryValue[]): string[] {
  return values
    .map((v) => String(v ?? '').trim())
    .filter((v) => v.length > 0);
}

function fileArray(values: FormDataEntryValue[]): File[] {
  return values.filter((v): v is File => v instanceof File && v.size > 0);
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
    outcomes: parseRichText(formData.get('outcomes')),
    highlights: nullable(formData.get('highlights')),
    partner_orgs: stringArray(formData.getAll('partner_orgs')),
    age_bands: stringArray(formData.getAll('age_bands')),
    roles: stringArray(formData.getAll('roles')),
  };
}

async function resolveSlugs(
  supabase: Awaited<ReturnType<typeof requireAuth>>['supabase'],
  payload: { location_id: string | null; sub_project_id: string }
) {
  const [locRes, spRes] = await Promise.all([
    payload.location_id
      ? supabase.from('locations').select('slug').eq('id', payload.location_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from('sub_projects').select('slug').eq('id', payload.sub_project_id).maybeSingle(),
  ]);
  return {
    location: (locRes.data as { slug?: string } | null)?.slug ?? null,
    subProject: (spRes.data as { slug?: string } | null)?.slug ?? null,
  };
}

export async function createActivity(formData: FormData) {
  const { supabase, user } = await requireAuth();
  await rateLimit(user.id, 'activity:write', { max: 20 });
  const payload = payloadFromForm(formData);
  if (!payload.sub_project_id) throw new Error('Sub-project is required');

  const activityId = nullable(formData.get('activity_id')) ?? crypto.randomUUID();
  const newFiles = fileArray(formData.getAll('media_files'));

  const mediaUrls = newFiles.length
    ? await Promise.all(newFiles.map((f) => uploadActivityMedia(activityId, f)))
    : [];

  const { error } = await supabase.from('activities').insert({
    id: activityId,
    ...payload,
    media_urls: mediaUrls,
    created_by: user.id,
  });
  if (error) throw new Error(error.message);

  const slugs = await resolveSlugs(supabase, payload);
  invalidateActivity(activityId, payload.event_year, slugs);
  revalidatePath('/admin/activities');
  redirect('/admin/activities');
}

export async function updateActivity(id: string, formData: FormData) {
  const { supabase, user } = await requireAuth();
  await rateLimit(user.id, 'activity:write', { max: 30 });
  const payload = payloadFromForm(formData);
  if (!payload.sub_project_id) throw new Error('Sub-project is required');

  const { data: prev } = await supabase
    .from('activities')
    .select('event_year, sub_project_id, location_id')
    .eq('id', id)
    .maybeSingle();

  const keepUrls = stringArray(formData.getAll('keep_urls'));
  const newFiles = fileArray(formData.getAll('media_files'));
  const newUrls = newFiles.length
    ? await Promise.all(newFiles.map((f) => uploadActivityMedia(id, f)))
    : [];

  const { error } = await supabase
    .from('activities')
    .update({ ...payload, media_urls: [...keepUrls, ...newUrls] })
    .eq('id', id);
  if (error) throw new Error(error.message);

  // Invalidate both the previous slugs/year and the new ones so reassignments propagate.
  if (prev) {
    const prevSlugs = await resolveSlugs(supabase, {
      location_id: (prev as { location_id: string | null }).location_id,
      sub_project_id: (prev as { sub_project_id: string }).sub_project_id,
    });
    invalidateActivity(id, (prev as { event_year: number }).event_year, prevSlugs);
  }
  const slugs = await resolveSlugs(supabase, payload);
  invalidateActivity(id, payload.event_year, slugs);
  revalidatePath('/admin/activities');
  revalidatePath(`/admin/activities/${id}`);
  redirect('/admin/activities');
}

export async function deleteActivity(formData: FormData) {
  const { supabase, user } = await requireAuth();
  await rateLimit(user.id, 'activity:write', { max: 20 });
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  const { data: prev } = await supabase
    .from('activities')
    .select('event_year, sub_project_id, location_id')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabase.from('activities').delete().eq('id', id);
  if (error) throw new Error(error.message);

  if (prev) {
    const slugs = await resolveSlugs(supabase, {
      location_id: (prev as { location_id: string | null }).location_id,
      sub_project_id: (prev as { sub_project_id: string }).sub_project_id,
    });
    invalidateActivity(id, (prev as { event_year: number }).event_year, slugs);
  } else {
    invalidateActivity(id, null);
  }
  revalidatePath('/admin/activities');
}

// ---- Inline creators (called from the activity form) ----

export async function createLocationInline(input: {
  name: string;
  type: 'university' | 'hub' | 'online' | 'other';
}): Promise<{ id: string; name: string; type: string }> {
  const { supabase, user } = await requireAuth();
  await rateLimit(user.id, 'lookup:write', { max: 30 });
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

  updateTag('taxonomy:locations');
  revalidatePath('/admin/lookups');
  return data;
}

export async function createSubCategoryInline(input: {
  category_id: string;
  name: string;
}): Promise<{ id: string; category_id: string; name: string }> {
  const { supabase, user } = await requireAuth();
  await rateLimit(user.id, 'lookup:write', { max: 30 });
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

  updateTag('taxonomy:categories');
  revalidatePath('/admin/lookups');
  return data;
}
