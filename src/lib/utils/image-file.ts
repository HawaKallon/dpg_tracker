/**
 * Image upload rules shared by the browser picker and the server-side uploader.
 * Isomorphic — no `server-only`, no browser globals — so both sides agree on
 * what is accepted instead of drifting apart.
 */

export const MEDIA_BUCKET = 'dpg-media';

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;

/** `accept` attribute for a file input. */
export const IMAGE_ACCEPT = ALLOWED_IMAGE_MIME.join(',');

export function extForImage(file: File): string {
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

/** Returns an error message, or null when the file is acceptable. */
export function imageRejectionReason(file: File): string | null {
  if (!(ALLOWED_IMAGE_MIME as readonly string[]).includes(file.type)) {
    return `${file.name}: unsupported format (use JPEG, PNG, or WebP)`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return `${file.name}: ${mb} MB is larger than the 10 MB limit`;
  }
  return null;
}

export function assertImage(file: File): void {
  const reason = imageRejectionReason(file);
  if (reason) throw new Error(reason);
}

export function activityMediaPath(activityId: string, file: File): string {
  return `activities/${activityId}/${crypto.randomUUID()}.${extForImage(file)}`;
}

/**
 * Public URLs served out of the media bucket look like
 * `<supabase-url>/storage/v1/object/public/dpg-media/<path>`. The activity form
 * submits URLs rather than files, so the Server Action must check that what it
 * is about to persist actually came from our own bucket.
 */
export function mediaPublicPrefix(supabaseUrl: string): string {
  return `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/${MEDIA_BUCKET}/`;
}

export function isMediaUrl(url: string, supabaseUrl: string): boolean {
  return url.startsWith(mediaPublicPrefix(supabaseUrl));
}

/** Storage object path for a public media URL, or null if it isn't one. */
export function mediaPathFromUrl(url: string, supabaseUrl: string): string | null {
  const prefix = mediaPublicPrefix(supabaseUrl);
  if (!url.startsWith(prefix)) return null;
  const path = url.slice(prefix.length).split('?')[0];
  return path ? decodeURIComponent(path) : null;
}
