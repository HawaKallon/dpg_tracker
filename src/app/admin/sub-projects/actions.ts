'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { uploadSubProjectHero, uploadFunderLogo } from '@/lib/supabase/storage';
import { rateLimit } from '@/lib/security/rate-limit';
import type { RichTextDoc } from '@/types/database';

function nullable(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function nullableInt(v: FormDataEntryValue | null): number | null {
  const s = nullable(v);
  if (s === null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.trunc(n) : null;
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

async function gate() {
  const ctx = await requireAuth();
  await rateLimit(ctx.user.id, 'sub-project:write', { max: 20 });
  return ctx;
}

function payloadFromForm(formData: FormData) {
  return {
    name: nullable(formData.get('name')) ?? '',
    slug: nullable(formData.get('slug')),
    display_order: nullableInt(formData.get('display_order')) ?? 0,
    is_active: formData.get('is_active') === 'on',
    funder_name: nullable(formData.get('funder_name')),
    description: parseRichText(formData.get('description')),
  };
}

export async function createSubProject(formData: FormData) {
  const { supabase } = await gate();
  const payload = payloadFromForm(formData);
  if (!payload.name) throw new Error('Name is required');
  if (!payload.slug) throw new Error('Slug is required');

  const id = nullable(formData.get('sub_project_id')) ?? crypto.randomUUID();

  const heroFile = formData.get('hero_file');
  const funderFile = formData.get('funder_logo_file');

  let hero_image_url: string | null = null;
  if (heroFile instanceof File && heroFile.size > 0) {
    hero_image_url = await uploadSubProjectHero(id, heroFile);
  }
  let funder_logo_url: string | null = null;
  if (funderFile instanceof File && funderFile.size > 0) {
    funder_logo_url = await uploadFunderLogo(id, funderFile);
  }

  const { error } = await supabase
    .from('sub_projects')
    .insert({ id, ...payload, hero_image_url, funder_logo_url });
  if (error) throw new Error(error.message);

  updateTag('taxonomy:sub-projects');
  updateTag('dashboard');
  if (payload.slug) updateTag(`sub-project:${payload.slug}`);
  revalidatePath('/admin/sub-projects');
  redirect('/admin/sub-projects');
}

export async function updateSubProject(id: string, formData: FormData) {
  const { supabase } = await gate();
  const payload = payloadFromForm(formData);
  if (!payload.name) throw new Error('Name is required');
  if (!payload.slug) throw new Error('Slug is required');

  const keepHero = nullable(formData.get('keep_hero_url'));
  const keepFunder = nullable(formData.get('keep_funder_url'));
  const heroFile = formData.get('hero_file');
  const funderFile = formData.get('funder_logo_file');

  let hero_image_url: string | null = keepHero;
  if (heroFile instanceof File && heroFile.size > 0) {
    hero_image_url = await uploadSubProjectHero(id, heroFile);
  }
  let funder_logo_url: string | null = keepFunder;
  if (funderFile instanceof File && funderFile.size > 0) {
    funder_logo_url = await uploadFunderLogo(id, funderFile);
  }

  const { data: prev } = await supabase
    .from('sub_projects')
    .select('slug')
    .eq('id', id)
    .maybeSingle();
  const prevSlug = prev?.slug as string | undefined;

  const { error } = await supabase
    .from('sub_projects')
    .update({ ...payload, hero_image_url, funder_logo_url })
    .eq('id', id);
  if (error) throw new Error(error.message);

  updateTag('taxonomy:sub-projects');
  updateTag('dashboard');
  if (prevSlug) updateTag(`sub-project:${prevSlug}`);
  if (payload.slug && payload.slug !== prevSlug) updateTag(`sub-project:${payload.slug}`);
  revalidatePath('/admin/sub-projects');
  revalidatePath(`/admin/sub-projects/${id}`);
  redirect('/admin/sub-projects');
}

export async function deleteSubProject(formData: FormData) {
  const { supabase } = await gate();
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  const { data: prev } = await supabase
    .from('sub_projects')
    .select('slug')
    .eq('id', id)
    .maybeSingle();
  const { error } = await supabase.from('sub_projects').delete().eq('id', id);
  if (error) throw new Error(error.message);
  updateTag('taxonomy:sub-projects');
  updateTag('dashboard');
  if (prev?.slug) updateTag(`sub-project:${prev.slug}`);
  revalidatePath('/admin/sub-projects');
}
