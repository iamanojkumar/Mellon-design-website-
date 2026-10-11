/**
 * Shared ordering for "related" lists: what the public pages render and what
 * the admin picker previews. Free of server imports so client components can
 * use it too.
 *
 * Rule: pinned items first, in the order picked; then automatic matches that
 * are not hidden. Nothing else is ever added — a page with no pins and no
 * matches shows no related section at all.
 */

export const RELATED_LIMIT = 3;

export type RelatedCandidate = {
  id: string;
  /** True when the item qualifies on its own (same service, same category…). */
  auto: boolean;
};

export type RelatedPicks = { pinned: string[]; hidden: string[] };

export const NO_PICKS: RelatedPicks = { pinned: [], hidden: [] };

/** Everything that qualifies, in display order — before the limit is applied. */
export function orderRelated<T extends RelatedCandidate>(
  candidates: T[],
  picks: RelatedPicks,
): T[] {
  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const pinnedIds = new Set(picks.pinned);
  const hiddenIds = new Set(picks.hidden);
  // A pin whose item is gone (unpublished, deleted) simply drops out.
  const pinned = picks.pinned
    .map((id) => byId.get(id))
    .filter((candidate): candidate is T => !!candidate);
  const automatic = candidates.filter(
    (candidate) => candidate.auto && !pinnedIds.has(candidate.id) && !hiddenIds.has(candidate.id),
  );
  return [...pinned, ...automatic];
}

export function pickRelated<T extends RelatedCandidate>(
  candidates: T[],
  picks: RelatedPicks,
  limit = RELATED_LIMIT,
): T[] {
  return orderRelated(candidates, picks).slice(0, limit);
}

/** Does a project qualify for a service or industry page on its own? */
export function projectMatchesPage(
  project: { service: string; alsoServices: string[]; category: string },
  kind: "service" | "industry",
  slug: string,
): boolean {
  if (!slug) return false;
  return kind === "service"
    ? project.service === slug || project.alsoServices.includes(slug)
    : project.category === slug;
}

/** Same category (case-insensitive) is the only automatic match for articles. */
export function postMatchesPost(
  post: { category: string | null },
  other: { category: string | null },
): boolean {
  const a = post.category?.trim().toLowerCase();
  const b = other.category?.trim().toLowerCase();
  return !!a && a === b;
}
