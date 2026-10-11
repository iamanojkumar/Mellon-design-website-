import "server-only";

/**
 * Per-page picks for the "Related work" section of a service or industry page
 * (supabase/migrations/20261007000000_related_work_controls.sql). Server-only,
 * straight to PostgREST like lib/projects.ts.
 *
 * The public read is tagged `projects:<locale>` so a save here, a publish and an
 * unpublish all refresh the pages through the one tag the admin already revalidates.
 * It never throws: if the table is missing or Supabase blips, pages fall back to
 * automatic matches rather than failing to render.
 */

import { NO_PICKS, type RelatedPicks } from "@/lib/related-pick";

export type RelatedKind = "service" | "industry";

export type RelatedOverride = RelatedPicks & { kind: RelatedKind; slug: string };

type Row = { kind: RelatedKind; slug: string; pinned: string[] | null; hidden: string[] | null };

const PUBLIC_CACHE_SECONDS = 300;

function restConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set");
  return { url, key };
}

function headers(key: string, extra?: Record<string, string>) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

function fromRow(row: Row): RelatedOverride {
  return {
    kind: row.kind,
    slug: row.slug,
    pinned: row.pinned ?? [],
    hidden: row.hidden ?? [],
  };
}

/** Public: the picks for one page. Empty picks on any failure. */
export async function getRelatedPicks(
  locale: string,
  kind: RelatedKind,
  slug: string,
): Promise<RelatedPicks> {
  try {
    const { url, key } = restConfig();
    const response = await fetch(
      `${url}/rest/v1/related_work?locale=eq.${encodeURIComponent(locale)}&kind=eq.${kind}&slug=eq.${encodeURIComponent(slug)}`,
      {
        headers: headers(key),
        next: { tags: [`projects:${locale}`], revalidate: PUBLIC_CACHE_SECONDS },
      },
    );
    if (!response.ok) return NO_PICKS;
    const rows = (await response.json()) as Row[];
    return rows[0] ? fromRow(rows[0]) : NO_PICKS;
  } catch (error) {
    console.error("[related-work] could not read picks", error);
    return NO_PICKS;
  }
}

/** Admin: every saved page in a locale. */
export async function listRelatedOverrides(locale: string): Promise<RelatedOverride[]> {
  const { url, key } = restConfig();
  const response = await fetch(
    `${url}/rest/v1/related_work?locale=eq.${encodeURIComponent(locale)}`,
    { headers: headers(key), cache: "no-store" },
  );
  if (!response.ok) {
    throw new Error(`Supabase list failed: ${response.status} ${await response.text()}`);
  }
  return ((await response.json()) as Row[]).map(fromRow);
}

/** Upserts one page's picks. */
export async function saveRelatedOverride(
  locale: string,
  kind: RelatedKind,
  slug: string,
  picks: RelatedPicks,
): Promise<RelatedOverride> {
  const { url, key } = restConfig();
  const response = await fetch(`${url}/rest/v1/related_work`, {
    method: "POST",
    headers: headers(key, { Prefer: "resolution=merge-duplicates,return=representation" }),
    body: JSON.stringify({
      locale,
      kind,
      slug,
      pinned: picks.pinned,
      hidden: picks.hidden,
      updated_at: new Date().toISOString(),
    }),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Supabase save failed: ${response.status} ${await response.text()}`);
  }
  return fromRow(((await response.json()) as Row[])[0]);
}
