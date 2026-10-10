import "server-only";

/**
 * Landing pages created in /admin/landing-editor
 * (supabase/migrations/20261006000000_landing_pages_and_chat_entities.sql).
 * Same PostgREST-with-service-role pattern as lib/projects.ts. The copy column
 * is free-form jsonb, so it is coerced into a full, valid LandingCopy on the way
 * out; a half-written draft always opens, and a public render never throws.
 */

import type { ProjectStatus } from "@/lib/project-fields";
import { coerceLandingCopy, type LandingCopy } from "@/lib/landing-content";

export type LandingStatus = ProjectStatus;

export type LandingRow = {
  id: string;
  slug: string;
  locale: string;
  locales: string[];
  status: LandingStatus;
  indexable: boolean;
  service: string | null;
  demandNote: string | null;
  copy: LandingCopy;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LandingInput = Omit<LandingRow, "id" | "publishedAt" | "createdAt" | "updatedAt">;

type Row = {
  id: string;
  slug: string;
  locale: string;
  locales: string[] | null;
  status: LandingStatus;
  indexable: boolean;
  service: string | null;
  demand_note: string | null;
  copy: unknown;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

const fromRow = (row: Row): LandingRow => ({
  id: row.id,
  slug: row.slug,
  locale: row.locale,
  locales: row.locales ?? [],
  status: row.status,
  indexable: row.indexable,
  service: row.service,
  demandNote: row.demand_note,
  copy: coerceLandingCopy(row.copy),
  publishedAt: row.published_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toRow = (input: LandingInput) => ({
  slug: input.slug,
  locale: input.locale,
  locales: input.locales,
  status: input.status,
  indexable: input.indexable,
  service: input.service || null,
  demand_note: input.demandNote || null,
  copy: input.copy,
});

function restConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set");
  return { url, key };
}

const headers = (key: string, extra?: Record<string, string>) => ({
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
  ...extra,
});

/** Bounds how long a build-cached public read can stay stale; see lib/projects.ts. */
const PUBLIC_CACHE_SECONDS = 300;

export class DuplicateLandingSlugError extends Error {
  constructor(slug: string) {
    super(`A landing page with the slug "${slug}" already exists.`);
    this.name = "DuplicateLandingSlugError";
  }
}

export async function listLandingPages(): Promise<LandingRow[]> {
  const { url, key } = restConfig();
  const response = await fetch(`${url}/rest/v1/landing_pages?order=updated_at.desc`, {
    headers: headers(key),
    next: { tags: ["landing"] },
  });
  if (!response.ok) {
    throw new Error(`Supabase list failed: ${response.status} ${await response.text()}`);
  }
  return ((await response.json()) as Row[]).map(fromRow);
}

export async function getPublishedLandingPages(): Promise<LandingRow[]> {
  const { url, key } = restConfig();
  const response = await fetch(`${url}/rest/v1/landing_pages?status=eq.published`, {
    headers: headers(key),
    next: { tags: ["landing"], revalidate: PUBLIC_CACHE_SECONDS },
  });
  if (!response.ok) {
    throw new Error(`Supabase list failed: ${response.status} ${await response.text()}`);
  }
  return ((await response.json()) as Row[]).map(fromRow);
}

export async function getLandingPageBySlug(slug: string): Promise<LandingRow | undefined> {
  const { url, key } = restConfig();
  const response = await fetch(
    `${url}/rest/v1/landing_pages?slug=eq.${encodeURIComponent(slug)}`,
    { headers: headers(key), next: { tags: ["landing"], revalidate: PUBLIC_CACHE_SECONDS } },
  );
  if (!response.ok) {
    throw new Error(`Supabase get failed: ${response.status} ${await response.text()}`);
  }
  const rows = (await response.json()) as Row[];
  return rows[0] ? fromRow(rows[0]) : undefined;
}

async function write(
  method: "POST" | "PATCH",
  path: string,
  input: LandingInput,
  extra: Record<string, unknown> = {},
): Promise<LandingRow> {
  const { url, key } = restConfig();
  const response = await fetch(`${url}/rest/v1/landing_pages${path}`, {
    method,
    headers: headers(key, { Prefer: "return=representation" }),
    body: JSON.stringify({ ...toRow(input), ...extra }),
    cache: "no-store",
  });
  if (!response.ok) {
    const text = await response.text();
    if (response.status === 409 || /duplicate key/i.test(text)) {
      throw new DuplicateLandingSlugError(input.slug);
    }
    throw new Error(`Supabase write failed: ${response.status} ${text}`);
  }
  return fromRow(((await response.json()) as Row[])[0]);
}

export const createLandingPage = (input: LandingInput) => write("POST", "", input);

export const updateLandingPage = (id: string, input: LandingInput) =>
  write("PATCH", `?id=eq.${encodeURIComponent(id)}`, input, {
    updated_at: new Date().toISOString(),
  });

export async function deleteLandingPage(id: string): Promise<void> {
  const { url, key } = restConfig();
  const response = await fetch(`${url}/rest/v1/landing_pages?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: headers(key),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Supabase delete failed: ${response.status} ${await response.text()}`);
  }
}
