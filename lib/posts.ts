import "server-only";

/**
 * Blog posts. Server-only, same pattern as lib/projects.ts: straight to
 * PostgREST with the service-role key. One locale per row, no fallback — a
 * locale's blog is whatever rows exist for it. `published_at` and
 * `previous_slugs` are maintained by database triggers
 * (supabase/migrations/20261003000000_blog_posts.sql).
 */

import type { ProjectStatus } from "@/lib/project-fields";

export type PostStatus = ProjectStatus;

export type Post = {
  id: string;
  locale: string;
  slug: string;
  title: string;
  summary: string | null;
  heroImage: string | null;
  heroImageAlt: string | null;
  heroImageWidth: number | null;
  heroImageHeight: number | null;
  /** #rrggbb behind the hero, or null for transparent (the default). */
  heroBg: string | null;
  /** Free-text label per locale; null when uncategorised. */
  category: string | null;
  content: string;
  featured: boolean;
  status: PostStatus;
  publishedAt: string | null;
  previousSlugs: string[];
  metaTitle: string | null;
  metaDescription: string | null;
  focusKeyword: string | null;
  canonicalUrl: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  noindex: boolean;
  /** Blog post ids pinned first in "Related articles", in order. */
  relatedPinned: string[];
  /** Blog post ids removed from the automatic (same-category) matches. */
  relatedHidden: string[];
  /** Optional audio version of the article (a recording of the author). */
  narrationUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PostInput = Omit<
  Post,
  "id" | "publishedAt" | "previousSlugs" | "createdAt" | "updatedAt"
>;

type PostRow = {
  id: string;
  locale: string;
  slug: string;
  title: string;
  summary: string | null;
  hero_image: string | null;
  hero_image_alt: string | null;
  hero_image_width: number | null;
  hero_image_height: number | null;
  hero_bg: string | null;
  category: string | null;
  content: string;
  featured: boolean;
  status: PostStatus;
  published_at: string | null;
  previous_slugs: string[] | null;
  meta_title: string | null;
  meta_description: string | null;
  focus_keyword: string | null;
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  noindex: boolean;
  related_pinned: string[] | null;
  related_hidden: string[] | null;
  narration_url: string | null;
  created_at: string;
  updated_at: string;
};

function fromRow(row: PostRow): Post {
  return {
    id: row.id,
    locale: row.locale,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    heroImage: row.hero_image,
    heroImageAlt: row.hero_image_alt,
    heroImageWidth: row.hero_image_width,
    heroImageHeight: row.hero_image_height,
    heroBg: row.hero_bg,
    category: row.category,
    content: row.content,
    featured: row.featured,
    status: row.status,
    publishedAt: row.published_at,
    previousSlugs: row.previous_slugs ?? [],
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    focusKeyword: row.focus_keyword,
    canonicalUrl: row.canonical_url,
    ogTitle: row.og_title,
    ogDescription: row.og_description,
    ogImage: row.og_image,
    noindex: row.noindex,
    relatedPinned: row.related_pinned ?? [],
    relatedHidden: row.related_hidden ?? [],
    narrationUrl: row.narration_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(input: PostInput) {
  return {
    locale: input.locale,
    slug: input.slug,
    title: input.title,
    summary: input.summary || null,
    hero_image: input.heroImage || null,
    hero_image_alt: input.heroImageAlt || null,
    hero_image_width: input.heroImageWidth ?? null,
    hero_image_height: input.heroImageHeight ?? null,
    hero_bg: input.heroBg || null,
    category: input.category || null,
    content: input.content,
    featured: input.featured,
    status: input.status,
    meta_title: input.metaTitle || null,
    meta_description: input.metaDescription || null,
    focus_keyword: input.focusKeyword || null,
    canonical_url: input.canonicalUrl || null,
    og_title: input.ogTitle || null,
    og_description: input.ogDescription || null,
    og_image: input.ogImage || null,
    noindex: input.noindex,
    related_pinned: input.relatedPinned,
    related_hidden: input.relatedHidden,
    narration_url: input.narrationUrl || null,
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

/** Bounds how long a build-cached public read can go stale; see lib/projects.ts. */
const PUBLIC_CACHE_SECONDS = 300;

export class DuplicatePostSlugError extends Error {
  constructor(locale: string, slug: string) {
    super(`A post with slug "${slug}" already exists for locale "${locale}".`);
    this.name = "DuplicatePostSlugError";
  }
}

export function slugifyPost(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "post"
  );
}

/** Every post for one locale, newest first (admin). */
export async function listPosts(locale: string): Promise<Post[]> {
  const { url, key } = restConfig();
  const response = await fetch(
    `${url}/rest/v1/blog_posts?locale=eq.${encodeURIComponent(locale)}&order=created_at.desc`,
    { headers: restHeaders(key), next: { tags: ["posts", `posts:${locale}`] } },
  );
  if (!response.ok) {
    throw new Error(`Supabase list failed: ${response.status} ${await response.text()}`);
  }
  return (await response.json()).map(fromRow);
}

/** Published posts for one locale, newest first (public). */
export async function getPublishedPosts(locale: string): Promise<Post[]> {
  const { url, key } = restConfig();
  const response = await fetch(
    `${url}/rest/v1/blog_posts?locale=eq.${encodeURIComponent(locale)}&status=eq.published&order=published_at.desc.nullslast,created_at.desc`,
    {
      headers: restHeaders(key),
      next: { tags: ["posts", `posts:${locale}`], revalidate: PUBLIC_CACHE_SECONDS },
    },
  );
  if (!response.ok) {
    throw new Error(`Supabase list failed: ${response.status} ${await response.text()}`);
  }
  return (await response.json()).map(fromRow);
}

export async function getPost(locale: string, slug: string): Promise<Post | undefined> {
  const { url, key } = restConfig();
  const response = await fetch(
    `${url}/rest/v1/blog_posts?locale=eq.${encodeURIComponent(locale)}&slug=eq.${encodeURIComponent(slug)}`,
    {
      headers: restHeaders(key),
      next: { tags: [`posts:${locale}`], revalidate: PUBLIC_CACHE_SECONDS },
    },
  );
  if (!response.ok) {
    throw new Error(`Supabase get failed: ${response.status} ${await response.text()}`);
  }
  const rows = await response.json();
  return rows[0] ? fromRow(rows[0]) : undefined;
}

/** A post by a slug it used to have, so a renamed URL can 301. */
export async function getPostByPreviousSlug(
  locale: string,
  slug: string,
): Promise<Post | undefined> {
  const { url, key } = restConfig();
  const filter = `previous_slugs=cs.{"${encodeURIComponent(slug)}"}`;
  const response = await fetch(
    `${url}/rest/v1/blog_posts?locale=eq.${encodeURIComponent(locale)}&${filter}`,
    {
      headers: restHeaders(key),
      next: { tags: [`posts:${locale}`], revalidate: PUBLIC_CACHE_SECONDS },
    },
  );
  if (!response.ok) {
    throw new Error(
      `Supabase slug-history lookup failed: ${response.status} ${await response.text()}`,
    );
  }
  const rows = await response.json();
  return rows[0] ? fromRow(rows[0]) : undefined;
}

async function write(
  method: "POST" | "PATCH",
  path: string,
  input: PostInput,
  extra: Record<string, unknown> = {},
): Promise<Post> {
  const { url, key } = restConfig();
  const response = await fetch(`${url}/rest/v1/blog_posts${path}`, {
    method,
    headers: restHeaders(key, { Prefer: "return=representation" }),
    body: JSON.stringify({ ...toRow(input), ...extra }),
    cache: "no-store",
  });
  if (!response.ok) {
    const text = await response.text();
    if (response.status === 409 || /duplicate key/i.test(text)) {
      throw new DuplicatePostSlugError(input.locale, input.slug);
    }
    throw new Error(`Supabase write failed: ${response.status} ${text}`);
  }
  return fromRow((await response.json())[0]);
}

export const createPost = (input: PostInput) => write("POST", "", input);

export const updatePost = (id: string, input: PostInput) =>
  write("PATCH", `?id=eq.${encodeURIComponent(id)}`, input, {
    updated_at: new Date().toISOString(),
  });

export async function deletePost(id: string): Promise<void> {
  const { url, key } = restConfig();
  const response = await fetch(`${url}/rest/v1/blog_posts?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: restHeaders(key),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Supabase delete failed: ${response.status} ${await response.text()}`);
  }
}
