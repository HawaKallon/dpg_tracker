'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { uploadLocationLogo } from '@/lib/supabase/storage';
import type { RichTextDoc } from '@/types/database';

function nullable(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function nullableNum(v: FormDataEntryValue | null): number | null {
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

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return { supabase, user };
}

type LocationType = 'university' | 'hub' | 'online' | 'other';

function payloadFromForm(formData: FormData) {
  const typeRaw = String(formData.get('type') ?? 'other');
  const type: LocationType =
    typeRaw === 'university' || typeRaw === 'hub' || typeRaw === 'online' || typeRaw === 'other'
      ? typeRaw
      : 'other';
  return {
    name: nullable(formData.get('name')) ?? '',
    slug: nullable(formData.get('slug')),
    type,
    region: nullable(formData.get('region')),
    partner_type: nullable(formData.get('partner_type')),
    website_url: nullable(formData.get('website_url')),
    lat: nullableNum(formData.get('lat')),
    lng: nullableNum(formData.get('lng')),
    first_active_date: nullable(formData.get('first_active_date')),
    description: parseRichText(formData.get('description')),
  };
}

export async function createLocation(formData: FormData) {
  const { supabase } = await requireAuth();
  const payload = payloadFromForm(formData);
  if (!payload.name) throw new Error('Name is required');

  const id = nullable(formData.get('location_id')) ?? crypto.randomUUID();
  const logoFile = formData.get('logo_file');
  let logo_url: string | null = null;
  if (logoFile instanceof File && logoFile.size > 0) {
    logo_url = await uploadLocationLogo(id, logoFile);
  }

  const { error } = await supabase.from('locations').insert({ id, ...payload, logo_url });
  if (error) throw new Error(error.message);

  revalidatePath('/admin/locations');
  revalidatePath('/');
  redirect('/admin/locations');
}

export async function updateLocation(id: string, formData: FormData) {
  const { supabase } = await requireAuth();
  const payload = payloadFromForm(formData);
  if (!payload.name) throw new Error('Name is required');

  const keepLogo = nullable(formData.get('keep_logo_url'));
  const logoFile = formData.get('logo_file');
  let logo_url: string | null = keepLogo;
  if (logoFile instanceof File && logoFile.size > 0) {
    logo_url = await uploadLocationLogo(id, logoFile);
  }

  const { data: prev } = await supabase
    .from('locations')
    .select('slug')
    .eq('id', id)
    .maybeSingle();
  const prevSlug = prev?.slug as string | undefined;

  const { error } = await supabase
    .from('locations')
    .update({ ...payload, logo_url })
    .eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/admin/locations');
  revalidatePath(`/admin/locations/${id}`);
  if (prevSlug) revalidatePath(`/locations/${prevSlug}`);
  if (payload.slug) revalidatePath(`/locations/${payload.slug}`);
  revalidatePath('/');
  redirect('/admin/locations');
}

export async function deleteLocation(formData: FormData) {
  const { supabase } = await requireAuth();
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  const { error } = await supabase.from('locations').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/locations');
  revalidatePath('/');
}
