import "server-only";

/**
 * Portfolio/case-study projects. Server-only: reads and writes go straight to
 * PostgREST with the service-role key, the same pattern as lib/submissions.ts
 * (no @supabase/supabase-js client, no anon key, nothing exposed to the browser).
 *
 * Each project belongs to exactly one locale — there is no fallback/inheritance
 * here like content/registry.ts. A locale's project list is whatever rows exist
 * for that locale, full stop; an empty result means that locale has none yet.
 *
 * `publishedAt` is stamped by a database trigger the first time a row reaches
 * status 'published' (see supabase/migrations/..._published_at_trigger.sql), so
 * nothing here needs to read a row back before writing it.
 */

import type { ProjectStatus, SchemaType } from "@/lib/project-fields";
import { parseBlocks, type ProjectBlock } from "@/lib/project-blocks";

export type { ProjectStatus, SchemaType };

/** Search/social fields, kept as their own shape so a future content type can
 *  reuse them and lib/project-seo.ts without depending on Project itself. */
export type SeoInput = {
  /** Empty means "use the on-page title/summary" — same pattern as the OG fields. */
  metaTitle: string | null;
  metaDescription: string | null;
  focusKeyword: string | null;
  canonicalUrl: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  schemaType: SchemaType;
  /** Live, but deliberately kept out of search results. */
  noindex: boolean;
  jsonLdOverride: string | null;
  customHead: string | null;
  customBody: string | null;
};

/** Hero image and the metadata a public page needs to render it well. */
export type HeroImageInput = {
  heroImage: string | null;
  heroImageAlt: string | null;
  heroImageWidth: number | null;
  heroImageHeight: number | null;
};

export type Project = SeoInput &
  HeroImageInput & {
    id: string;
    locale: string;
    slug: string;
    title: string;
    summary: string | null;
    category: string;
    service: string;
    content: string;
    /** Designed sections that sit alongside the rich-text body. */
    blocks: ProjectBlock[];
    featured: boolean;
    folderId: string | null;
    status: ProjectStatus;
    publishedAt: string | null;
    /** Slugs this project used to answer to. Maintained by a database trigger. */
    previousSlugs: string[];
    createdAt: string;
    updatedAt: string;
  };

export type ProjectInput = SeoInput &
  HeroImageInput & {
    locale: string;
    slug: string;
    title: string;
    summary: string | null;
    category: string;
    service: string;
    content: string;
    blocks: ProjectBlock[];
    featured: boolean;
    folderId: string | null;
    status: ProjectStatus;
  };

type ProjectRow = {
  id: string;
  locale: string;
  slug: string;
  title: string;
  summary: string | null;
  category: string;
  service: string;
  hero_image: string | null;
  hero_image_alt: string | null;
  hero_image_width: number | null;
  hero_image_height: number | null;
  content: string;
  blocks: unknown;
  featured: boolean;
  folder_id: string | null;
  status: ProjectStatus;
  published_at: string | null;
  previous_slugs: string[] | null;
  meta_title: string | null;
  meta_description: string | null;
  noindex: boolean;
  focus_keyword: string | null;
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  schema_type: SchemaType;
  json_ld_override: string | null;
  custom_head: string | null;
  custom_body: string | null;
  created_at: string;
  updated_at: string;
};

function fromRow(row: ProjectRow): Project {
  return {
    id: row.id,
    locale: row.locale,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    category: row.category,
    service: row.service,
    heroImage: row.hero_image,
    heroImageAlt: row.hero_image_alt,
    heroImageWidth: row.hero_image_width,
    heroImageHeight: row.hero_image_height,
    content: row.content,
    blocks: parseBlocks(row.blocks),
    featured: row.featured,
    folderId: row.folder_id,
    status: row.status,
    publishedAt: row.published_at,
    previousSlugs: row.previous_slugs ?? [],
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    noindex: row.noindex,
    focusKeyword: row.focus_keyword,
    canonicalUrl: row.canonical_url,
    ogTitle: row.og_title,
    ogDescription: row.og_description,
    ogImage: row.og_image,
    schemaType: row.schema_type,
    jsonLdOverride: row.json_ld_override,
    customHead: row.custom_head,
    customBody: row.custom_body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(input: ProjectInput) {
  return {
    locale: input.locale,
    slug: input.slug,
    title: input.title,
    summary: input.summary || null,
    category: input.category,
    service: input.service,
    hero_image: input.heroImage || null,
    hero_image_alt: input.heroImageAlt || null,
    hero_image_width: input.heroImageWidth ?? null,
    hero_image_height: input.heroImageHeight ?? null,
    content: input.content,
    blocks: input.blocks,
    featured: input.featured,
    folder_id: input.folderId || null,
    status: input.status,
    meta_title: input.metaTitle || null,
    meta_description: input.metaDescription || null,
    noindex: input.noindex,
    focus_keyword: input.focusKeyword || null,
    canonical_url: input.canonicalUrl || null,
    og_title: input.ogTitle || null,
    og_description: input.ogDescription || null,
    og_image: input.ogImage || null,
    schema_type: input.schemaType,
    json_ld_override: input.jsonLdOverride || null,
    custom_head: input.customHead || null,
    custom_body: input.customBody || null,
  };
}

function restConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set");
  }
  return { url, key };
}

function restHeaders(key: string, extra?: Record<string, string>) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

/** Thrown on a unique-constraint violation (duplicate locale+slug). */
export class DuplicateSlugError extends Error {
  constructor(locale: string, slug: string) {
    super(`A project with slug "${slug}" already exists for locale "${locale}".`);
    this.name = "DuplicateSlugError";
  }
}

export function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "project"
  );
}

/** All projects for one locale, newest first. No fallback to another locale. */
export async function listProjects(locale: string): Promise<Project[]> {
  const { url, key } = restConfig();
  const response = await fetch(
    `${url}/rest/v1/projects?locale=eq.${encodeURIComponent(locale)}&order=created_at.desc`,
    {
      headers: restHeaders(key),
      next: { tags: ["projects", `projects:${locale}`] },
    },
  );
  if (!response.ok) {
    throw new Error(`Supabase list failed: ${response.status} ${await response.text()}`);
  }
  return (await response.json()).map(fromRow);
}

/**
 * Public-facing accessor for future site pages: only projects that are live in
 * that locale. Draft and unpublished ones never leave the admin. An empty array
 * means this locale has nothing published — callers render their own empty state
 * rather than falling back to another locale's work.
 */
export async function getPublishedProjects(locale: string): Promise<Project[]> {
  const { url, key } = restConfig();
  const response = await fetch(
    `${url}/rest/v1/projects?locale=eq.${encodeURIComponent(locale)}&status=eq.published&order=created_at.desc`,
    {
      headers: restHeaders(key),
      next: { tags: ["projects", `projects:${locale}`] },
    },
  );
  if (!response.ok) {
    throw new Error(`Supabase list failed: ${response.status} ${await response.text()}`);
  }
  return (await response.json()).map(fromRow);
}

export async function getProjectById(id: string): Promise<Project | undefined> {
  const { url, key } = restConfig();
  const response = await fetch(`${url}/rest/v1/projects?id=eq.${encodeURIComponent(id)}`, {
    headers: restHeaders(key),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Supabase get failed: ${response.status} ${await response.text()}`);
  }
  const rows = await response.json();
  return rows[0] ? fromRow(rows[0]) : undefined;
}

export async function getProject(locale: string, slug: string): Promise<Project | undefined> {
  const { url, key } = restConfig();
  const response = await fetch(
    `${url}/rest/v1/projects?locale=eq.${encodeURIComponent(locale)}&slug=eq.${encodeURIComponent(slug)}`,
    { headers: restHeaders(key), next: { tags: [`projects:${locale}`] } },
  );
  if (!response.ok) {
    throw new Error(`Supabase get failed: ${response.status} ${await response.text()}`);
  }
  const rows = await response.json();
  return rows[0] ? fromRow(rows[0]) : undefined;
}

/**
 * Finds a project by a slug it *used* to have, so a renamed project's old URL
 * can 301 to the current one instead of 404ing. Returns undefined when the slug
 * was never used here — the caller should then render a real 404.
 */
export async function getProjectByPreviousSlug(
  locale: string,
  slug: string,
): Promise<Project | undefined> {
  const { url, key } = restConfig();
  // PostgREST array-contains: previous_slugs @> {slug}
  const filter = `previous_slugs=cs.{"${encodeURIComponent(slug)}"}`;
  const response = await fetch(
    `${url}/rest/v1/projects?locale=eq.${encodeURIComponent(locale)}&${filter}`,
    { headers: restHeaders(key), next: { tags: [`projects:${locale}`] } },
  );
  if (!response.ok) {
    throw new Error(`Supabase slug-history lookup failed: ${response.status} ${await response.text()}`);
  }
  const rows = await response.json();
  return rows[0] ? fromRow(rows[0]) : undefined;
}

export async function createProject(input: ProjectInput): Promise<Project> {
  const { url, key } = restConfig();
  const response = await fetch(`${url}/rest/v1/projects`, {
    method: "POST",
    headers: restHeaders(key, { Prefer: "return=representation" }),
    body: JSON.stringify(toRow(input)),
    cache: "no-store",
  });
  if (!response.ok) {
    const text = await response.text();
    if (response.status === 409 || /duplicate key/i.test(text)) {
      throw new DuplicateSlugError(input.locale, input.slug);
    }
    throw new Error(`Supabase insert failed: ${response.status} ${text}`);
  }
  const rows = await response.json();
  return fromRow(rows[0]);
}

export async function updateProject(id: string, input: ProjectInput): Promise<Project> {
  const { url, key } = restConfig();
  const response = await fetch(`${url}/rest/v1/projects?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: restHeaders(key, { Prefer: "return=representation" }),
    body: JSON.stringify({ ...toRow(input), updated_at: new Date().toISOString() }),
    cache: "no-store",
  });
  if (!response.ok) {
    const text = await response.text();
    if (response.status === 409 || /duplicate key/i.test(text)) {
      throw new DuplicateSlugError(input.locale, input.slug);
    }
    throw new Error(`Supabase update failed: ${response.status} ${text}`);
  }
  const rows = await response.json();
  return fromRow(rows[0]);
}

/**
 * Moves a project to another locale, keeping the same row — so its id, body,
 * blocks, SEO fields and publish history all survive. The counterpart to
 * duplicate-and-translate, which leaves the original where it was.
 *
 * Two things cannot come along:
 *  - `folder_id`, because folders belong to one locale (project_folders is
 *    keyed by locale). A moved project lands unfiled rather than pointing at
 *    a folder that is not in its new locale's sidebar.
 *  - the slug, *if* the target locale already uses it. Slugs are unique per
 *    locale, so a clash is a real 409; the caller resolves it by passing a
 *    free slug rather than having one silently invented here.
 *
 * `previous_slugs` is deliberately untouched. The old URL lived under the old
 * locale prefix, which no longer resolves to this project, and the slug-history
 * lookup is already locale-scoped — so carrying it over would be meaningless
 * at best and a wrong 301 at worst.
 */
export async function moveProject(
  id: string,
  targetLocale: string,
  slug: string,
): Promise<Project> {
  const { url, key } = restConfig();
  const response = await fetch(`${url}/rest/v1/projects?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: restHeaders(key, { Prefer: "return=representation" }),
    body: JSON.stringify({
      locale: targetLocale,
      slug,
      folder_id: null,
      updated_at: new Date().toISOString(),
    }),
    cache: "no-store",
  });
  if (!response.ok) {
    const text = await response.text();
    if (response.status === 409 || /duplicate key/i.test(text)) {
      throw new DuplicateSlugError(targetLocale, slug);
    }
    throw new Error(`Supabase move failed: ${response.status} ${text}`);
  }
  const rows = await response.json();
  return fromRow(rows[0]);
}

export async function deleteProject(id: string): Promise<void> {
  const { url, key } = restConfig();
  const response = await fetch(`${url}/rest/v1/projects?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: restHeaders(key),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Supabase delete failed: ${response.status} ${await response.text()}`);
  }
}
