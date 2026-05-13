import 'server-only';
import { createClient } from '@/lib/supabase/server';

const BUCKET = 'dpg-media';
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

function extFor(file: File): string {
  const dot = file.name.lastIndexOf('.');
  const ext = dot >= 0 ? file.name.slice(dot + 1).toLowerCase() : '';
  if (ext === 'jpg' || ext === 'jpeg') return 'jpg';
  if (ext === 'png') return 'png';
  if (ext === 'webp') return 'webp';
  if (file.type === 'image/jpeg') return 'jpg';
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'bin';
}

function assertImage(file: File) {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error(`Unsupported image type: ${file.type || 'unknown'}`);
  }
  if (file.size > MAX_BYTES) {
    throw new Error(`Image too large (${(file.size / 1024 / 1024).toFixed(1)} MB, max 10 MB)`);
  }
}

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

export async function uploadActivityMedia(activityId: string, file: File): Promise<string> {
  const path = `activities/${activityId}/${crypto.randomUUID()}.${extFor(file)}`;
  return uploadAndPublicUrl(path, file);
}

export async function uploadLocationLogo(locationId: string, file: File): Promise<string> {
  const path = `locations/${locationId}/logo.${extFor(file)}`;
  return uploadAndPublicUrl(path, file, { upsert: true });
}

export async function uploadSubProjectHero(subProjectId: string, file: File): Promise<string> {
  const path = `sub_projects/${subProjectId}/hero.${extFor(file)}`;
  return uploadAndPublicUrl(path, file, { upsert: true });
}

export async function uploadFunderLogo(subProjectId: string, file: File): Promise<string> {
  const path = `sub_projects/${subProjectId}/funder.${extFor(file)}`;
  return uploadAndPublicUrl(path, file, { upsert: true });
}
