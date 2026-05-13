/**
 * Client-side slug preview. The DB trigger is the source of truth — this is
 * just for showing the user what the auto-generated slug will look like.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
