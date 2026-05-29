/**
 * Canonical-name guard for the `locations` table.
 *
 * Near-duplicates (FBC / Fourah Bay College; LUCT / Limkokwing) collapse to one
 * official full name. Server actions call `canonicalLocationName` before insert
 * and `findMatchingLocation` to reuse an existing row.
 *
 * Keep `LOCATION_ANCHORS` in sync with `supabase/migrations/0015_dedup_locations_full_names.sql`.
 */

export type LocationAnchor = {
  /** Official display name stored in `locations.name`. */
  canonicalName: string;
  /** Returns true when a lowercased location name belongs to this anchor. */
  predicate: (lowerName: string) => boolean;
};

export const LOCATION_ANCHORS: readonly LocationAnchor[] = [
  {
    canonicalName: 'Fourah Bay College',
    predicate: (n) =>
      n === 'fbc' ||
      n.includes('fourah bay college') ||
      n.includes('fbc digital'),
  },
  {
    canonicalName: 'Limkokwing University of Creative Technology',
    predicate: (n) => n === 'luct' || n.includes('limkokwing'),
  },
];

/** @deprecated Use LOCATION_ANCHORS — kept for docs referencing ALIAS_PATTERNS. */
export const ALIAS_PATTERNS = LOCATION_ANCHORS.map((a) => ({
  match: a.canonicalName.toLowerCase(),
  canonical: a.canonicalName,
}));

export function canonicalLocationName(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  const lower = trimmed.toLowerCase();
  for (const anchor of LOCATION_ANCHORS) {
    if (anchor.predicate(lower)) return anchor.canonicalName;
  }
  return trimmed;
}

export function anchorForLocationName(name: string): LocationAnchor | null {
  const lower = name.trim().toLowerCase();
  if (!lower) return null;
  for (const anchor of LOCATION_ANCHORS) {
    if (anchor.predicate(lower)) return anchor;
  }
  return null;
}

/**
 * Find an existing location row for user input (abbreviation, typo, or full name).
 */
export function findMatchingLocation<T extends { id: string; name: string }>(
  locations: T[],
  input: string
): T | null {
  const canonical = canonicalLocationName(input);
  const canonicalLower = canonical.toLowerCase();

  const exact = locations.find((l) => l.name.trim().toLowerCase() === canonicalLower);
  if (exact) return exact;

  const inputAnchor = anchorForLocationName(input);
  if (!inputAnchor) return null;

  return (
    locations.find((l) => inputAnchor.predicate(l.name.trim().toLowerCase())) ?? null
  );
}
