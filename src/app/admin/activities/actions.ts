'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { deleteMediaUrls } from '@/lib/supabase/storage';
import { rateLimit, RateLimitError } from '@/lib/security/rate-limit';
import { isMediaUrl } from '@/lib/utils/image-file';
import {
  canonicalLocationName,
  findMatchingLocation,
} from '@/lib/utils/canonical-location';
import type { RichTextDoc } from '@/types/database';

/**
 * Shape returned to `useActionState` in the activity form. `undefined` is the
 * initial state; a returned object means the save failed and the form should
 * show `error` while keeping everything the user typed.
 */
export type ActivityFormState = { error: string } | undefined;

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

/**
 * Participant counts are whole people. Anything negative or non-numeric is a
 * data-entry mistake, and letting it through only produces a raw
 * `violates check constraint "activities_total_count_check"` from Postgres.
 */
function countField(
  v: FormDataEntryValue | null,
  label: string
): { value: number | null } | { error: string } {
  const s = nullable(v);
  if (s === null) return { value: null };
  const n = Number(s);
  if (!Number.isFinite(n)) return { error: `${label} must be a number.` };
  if (n < 0) return { error: `${label} cannot be negative.` };
  return { value: Math.floor(n) };
}

/** True when a Tiptap doc contains no text — an "empty" editor should store null. */
function isEmptyRichText(doc: RichTextDoc): boolean {
  const hasText = (node: unknown): boolean => {
    if (!node || typeof node !== 'object') return false;
    const n = node as { type?: string; text?: string; content?: unknown[] };
    if (typeof n.text === 'string' && n.text.trim() !== '') return true;
    // Standalone nodes (images, horizontal rules) count as content even
    // though they carry no text.
    if (n.type && !['doc', 'paragraph', 'text'].includes(n.type) && !n.content) return true;
    return Array.isArray(n.content) && n.content.some(hasText);
  };
  return !hasText(doc);
}

function parseRichText(v: FormDataEntryValue | null): RichTextDoc | null {
  const s = nullable(v);
  if (!s) return null;
  try {
    const parsed = JSON.parse(s) as RichTextDoc;
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.content)) return null;
    if (parsed.content.length === 0 || isEmptyRichText(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function stringArray(values: FormDataEntryValue[]): string[] {
  return values
    .map((v) => String(v ?? '').trim())
    .filter((v) => v.length > 0);
}

/**
 * Photos are uploaded straight to Storage by the browser, so the form submits
 * URLs. Only accept URLs that live under this project's own media bucket —
 * never persist an arbitrary string a client handed us.
 */
function mediaUrlArray(values: FormDataEntryValue[]): string[] {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const seen = new Set<string>();
  return stringArray(values).filter((u) => {
    if (seen.has(u) || !isMediaUrl(u, base)) return false;
    seen.add(u);
    return true;
  });
}

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return { supabase, user };
}

type Payload = {
  sub_project_id: string;
  category_id: string | null;
  location_id: string | null;
  event_year: number;
  activity_date: string | null;
  month_label: string | null;
  male_count: number | null;
  female_count: number | null;
  total_count: number | null;
  notes: string | null;
  discourse_url: string | null;
  outcomes: RichTextDoc | null;
  highlights: string | null;
  partner_orgs: string[];
  age_bands: string[];
  roles: string[];
};

function payloadFromForm(formData: FormData): { payload: Payload } | { error: string } {
  const sub_project_id = String(formData.get('sub_project_id') ?? '').trim();
  if (!sub_project_id) return { error: 'Sub-project is required.' };

  const maleRes = countField(formData.get('male_count'), 'Male count');
  if ('error' in maleRes) return maleRes;
  const femaleRes = countField(formData.get('female_count'), 'Female count');
  if ('error' in femaleRes) return femaleRes;
  const totalRes = countField(formData.get('total_count'), 'Total');
  if ('error' in totalRes) return totalRes;

  const male = maleRes.value;
  const female = femaleRes.value;
  // Only derive a total when the user left it blank. A total the user typed is
  // theirs — the gender split is frequently incomplete, so M + F legitimately
  // disagrees with the headcount and must never silently overwrite it.
  const derived =
    male !== null || female !== null ? (male ?? 0) + (female ?? 0) : null;
  const total = totalRes.value ?? derived;

  const activity_date = nullable(formData.get('activity_date'));
  const yearRes = countField(formData.get('event_year'), 'Year');
  if ('error' in yearRes) return yearRes;
  const event_year =
    yearRes.value ??
    (activity_date ? Number(activity_date.slice(0, 4)) : new Date().getFullYear());

  return {
    payload: {
      sub_project_id,
      category_id: nullable(formData.get('category_id')),
      location_id: nullable(formData.get('location_id')),
      event_year,
      activity_date,
      month_label: nullable(formData.get('month_label')),
      male_count: male,
      female_count: female,
      total_count: total,
      notes: nullable(formData.get('notes')),
      discourse_url: nullable(formData.get('discourse_url')),
      outcomes: parseRichText(formData.get('outcomes')),
      highlights: nullable(formData.get('highlights')),
      partner_orgs: stringArray(formData.getAll('partner_orgs')),
      age_bands: stringArray(formData.getAll('age_bands')),
      roles: stringArray(formData.getAll('roles')),
    },
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

/**
 * Turns a Postgres/PostgREST error into something an admin can act on.
 *
 * A missing column here used to be swallowed by a retry loop that deleted the
 * offending field and saved anyway, which is how Outcomes, Highlights, Photos,
 * Partner orgs and Demographics silently vanished for months while the DB sat
 * ten migrations behind. Now it says so, loudly.
 */
function describeDbError(message: string): string {
  const missing = message.match(
    /Could not find the '([^']+)' column of 'activities'|column\s+activities\.([a-zA-Z0-9_]+)\s+does not exist|column\s+"?([a-zA-Z0-9_]+)"?\s+does not exist/i
  );
  if (missing) {
    const col = missing[1] ?? missing[2] ?? missing[3];
    return `The database is missing the "${col}" column, so this activity was not saved. Apply supabase/migrations/0018_catchup_0008_to_0017.sql in the Supabase SQL editor, then try again.`;
  }
  if (/row-level security/i.test(message)) {
    return 'Your account does not have permission to write activities. Ask a super admin to grant you the admin role.';
  }
  return message;
}

export async function createActivity(
  _prev: ActivityFormState,
  formData: FormData
): Promise<ActivityFormState> {
  let activityId: string;
  let payload: Payload;

  try {
    const { supabase, user } = await requireAuth();
    await rateLimit(user.id, 'activity:write', { max: 20 });

    const parsed = payloadFromForm(formData);
    if ('error' in parsed) return { error: parsed.error };
    payload = parsed.payload;

    activityId = nullable(formData.get('activity_id')) ?? crypto.randomUUID();
    const mediaUrls = mediaUrlArray(formData.getAll('media_urls'));

    const { error } = await supabase.from('activities').insert({
      id: activityId,
      ...payload,
      media_urls: mediaUrls,
      created_by: user.id,
    });
    if (error) return { error: describeDbError(error.message) };

    const slugs = await resolveSlugs(supabase, payload);
    invalidateActivity(activityId, payload.event_year, slugs);
    revalidatePath('/admin/activities');
  } catch (e) {
    if (e instanceof RateLimitError) return { error: e.message };
    return { error: e instanceof Error ? e.message : 'Failed to create activity.' };
  }

  // redirect() signals by throwing, so it must sit outside the try/catch.
  redirect('/admin/activities');
}

export async function updateActivity(
  id: string,
  _prev: ActivityFormState,
  formData: FormData
): Promise<ActivityFormState> {
  let payload: Payload;

  try {
    const { supabase, user } = await requireAuth();
    await rateLimit(user.id, 'activity:write', { max: 30 });

    const parsed = payloadFromForm(formData);
    if ('error' in parsed) return { error: parsed.error };
    payload = parsed.payload;

    const { data: prev, error: prevError } = await supabase
      .from('activities')
      .select('event_year, sub_project_id, location_id, media_urls, updated_at')
      .eq('id', id)
      .maybeSingle();

    // A missing column here would otherwise surface as "no longer exists".
    if (prevError) return { error: describeDbError(prevError.message) };
    if (!prev) return { error: 'This activity no longer exists.' };
    const prevRow = prev as {
      event_year: number;
      sub_project_id: string;
      location_id: string | null;
      media_urls: string[] | null;
      updated_at: string;
    };

    // Lost-update guard. Without it, submitting a form that was rendered before
    // someone else's save (a second tab, or a back-button return to a stale
    // render) silently reverts their work — which is exactly how a hand-entered
    // total of 200 got rewritten back to 197.
    const rowVersion = nullable(formData.get('row_version'));
    if (rowVersion && rowVersion !== prevRow.updated_at) {
      return {
        error:
          'This activity was changed in another tab or window after you opened this form. Reload the page to see the current values, then re-apply your edit.',
      };
    }

    const mediaUrls = mediaUrlArray(formData.getAll('media_urls'));

    const { error } = await supabase
      .from('activities')
      .update({ ...payload, media_urls: mediaUrls })
      .eq('id', id);
    if (error) return { error: describeDbError(error.message) };

    // Photos dropped from the gallery are no longer referenced anywhere.
    const removed = (prevRow.media_urls ?? []).filter((u) => !mediaUrls.includes(u));
    if (removed.length) await deleteMediaUrls(removed);

    // Invalidate both the previous slugs/year and the new ones so reassignments
    // propagate.
    const prevSlugs = await resolveSlugs(supabase, {
      location_id: prevRow.location_id,
      sub_project_id: prevRow.sub_project_id,
    });
    invalidateActivity(id, prevRow.event_year, prevSlugs);

    const slugs = await resolveSlugs(supabase, payload);
    invalidateActivity(id, payload.event_year, slugs);
    revalidatePath('/admin/activities');
    revalidatePath(`/admin/activities/${id}`);
  } catch (e) {
    if (e instanceof RateLimitError) return { error: e.message };
    return { error: e instanceof Error ? e.message : 'Failed to update activity.' };
  }

  redirect('/admin/activities');
}

export async function deleteActivity(formData: FormData) {
  const { supabase, user } = await requireAuth();
  await rateLimit(user.id, 'activity:write', { max: 20 });
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  const { data: prev } = await supabase
    .from('activities')
    .select('event_year, sub_project_id, location_id, media_urls')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabase.from('activities').delete().eq('id', id);
  if (error) throw new Error(describeDbError(error.message));

  if (prev) {
    const prevRow = prev as {
      event_year: number;
      sub_project_id: string;
      location_id: string | null;
      media_urls: string[] | null;
    };
    if (prevRow.media_urls?.length) await deleteMediaUrls(prevRow.media_urls);
    const slugs = await resolveSlugs(supabase, {
      location_id: prevRow.location_id,
      sub_project_id: prevRow.sub_project_id,
    });
    invalidateActivity(id, prevRow.event_year, slugs);
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
  const canonical = canonicalLocationName(input.name);
  if (!canonical) throw new Error('Name is required');

  const { data: allLocations } = await supabase.from('locations').select('id, name, type');
  const existing = findMatchingLocation(allLocations ?? [], input.name);
  if (existing) return existing;

  const { data, error } = await supabase
    .from('locations')
    .insert({ name: canonical, type: input.type })
    .select('id, name, type')
    .single();
  if (error) throw new Error(error.message);

  updateTag('taxonomy:locations');
  revalidatePath('/admin/lookups');
  return data;
}
