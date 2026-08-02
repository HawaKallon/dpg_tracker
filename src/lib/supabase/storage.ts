import 'server-only';
import { createClient } from '@/lib/supabase/server';
import {
  MEDIA_BUCKET,
  assertImage,
  extForImage,
  mediaPathFromUrl,
} from '@/lib/utils/image-file';

const BUCKET = MEDIA_BUCKET;

async function uploadAndPublicUrl(
  path: string,
  file: File,
  options: { upsert?: boolean } = {}
): Promise<string> {
  assertImage(file);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: options.upsert ?? false,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function uploadLocationLogo(locationId: string, file: File): Promise<string> {
  const path = `locations/${locationId}/logo.${extForImage(file)}`;
  return uploadAndPublicUrl(path, file, { upsert: true });
}

export async function uploadSubProjectHero(subProjectId: string, file: File): Promise<string> {
  const path = `sub_projects/${subProjectId}/hero.${extForImage(file)}`;
  return uploadAndPublicUrl(path, file, { upsert: true });
}

export async function uploadFunderLogo(subProjectId: string, file: File): Promise<string> {
  const path = `sub_projects/${subProjectId}/funder.${extForImage(file)}`;
  return uploadAndPublicUrl(path, file, { upsert: true });
}

/**
 * Remove objects that are no longer referenced by a row. Best-effort: a storage
 * failure must not roll back an otherwise-good database write, so this logs
 * rather than throws.
 */
export async function deleteMediaUrls(urls: string[]): Promise<void> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const paths = urls
    .map((u) => mediaPathFromUrl(u, base))
    .filter((p): p is string => p !== null);
  if (paths.length === 0) return;

  const supabase = await createClient();
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) {
    console.error('[storage] failed to remove orphaned media', paths, error.message);
  }
}
