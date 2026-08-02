'use client';

import { createClient } from '@/lib/supabase/client';
import {
  MEDIA_BUCKET,
  activityMediaPath,
  assertImage,
  mediaPathFromUrl,
} from '@/lib/utils/image-file';

/**
 * Browser-side uploads to the `dpg-media` bucket.
 *
 * Photos deliberately do NOT travel inside the activity form's Server Action
 * POST: that body is capped at 1 MB by Next (and 4.5 MB by Vercel), which used
 * to fail the whole "create activity" request as soon as a real photo was
 * attached. Uploading straight from the browser and submitting only the
 * resulting URLs keeps the form body tiny and lets the 10 MB limit be real.
 *
 * The `dpg-media admin insert` / `delete` storage policies run `is_admin()`
 * against the caller's session, so the anon key is sufficient here — an
 * authenticated admin can write, nobody else can.
 */
export async function uploadActivityMediaFromBrowser(
  activityId: string,
  file: File
): Promise<string> {
  assertImage(file);

  const supabase = createClient();
  const path = activityMediaPath(activityId, file);

  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(`${file.name}: upload failed — ${error.message}`);

  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Best-effort cleanup when the user removes a photo they just uploaded. A
 * failure here is not worth blocking the form on — the object simply stays in
 * the bucket unreferenced.
 */
export async function deleteMediaByUrl(url: string): Promise<void> {
  const path = mediaPathFromUrl(url, process.env.NEXT_PUBLIC_SUPABASE_URL ?? '');
  if (!path) return;
  const supabase = createClient();
  await supabase.storage.from(MEDIA_BUCKET).remove([path]);
}
