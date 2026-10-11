"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import {
  createPost,
  updatePost,
  deletePost,
  listPosts,
  slugifyPost,
  DuplicatePostSlugError,
  type Post,
  type PostInput,
  type PostStatus,
} from "@/lib/posts";
import { isEnabledLocale } from "@/lib/locale";
import { isAdminAuthed } from "@/lib/admin-auth";
import { normalizeHeroBg } from "@/lib/hero-tint";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type PostFormInput = {
  id: string | null;
  locale: string;
  slug: string;
  title: string;
  summary: string;
  heroImage: string;
  heroImageAlt: string;
  heroImageWidth: number | null;
  heroImageHeight: number | null;
  heroBg: string;
  category: string;
  content: string;
  featured: boolean;
  status: PostStatus;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  noindex: boolean;
  relatedPinned: string[];
  relatedHidden: string[];
  narrationUrl: string;
};

async function requireAuthed() {
  if (!(await isAdminAuthed())) redirect("/admin/login");
}

function toPostInput(input: PostFormInput): PostInput {
  return {
    locale: input.locale,
    slug: slugifyPost(input.slug.trim() || input.title),
    title: input.title.trim(),
    summary: input.summary.trim() || null,
    heroImage: input.heroImage.trim() || null,
    heroImageAlt: input.heroImageAlt.trim() || null,
    heroImageWidth: input.heroImageWidth,
    heroImageHeight: input.heroImageHeight,
    heroBg: normalizeHeroBg(input.heroBg),
    category: input.category.trim().replace(/\s+/g, " ") || null,
    content: input.content,
    featured: input.featured,
    status: input.status,
    metaTitle: input.metaTitle.trim() || null,
    metaDescription: input.metaDescription.trim() || null,
    focusKeyword: input.focusKeyword.trim() || null,
    canonicalUrl: input.canonicalUrl.trim() || null,
    ogTitle: input.ogTitle.trim() || null,
    ogDescription: input.ogDescription.trim() || null,
    ogImage: input.ogImage.trim() || null,
    noindex: input.noindex,
    relatedPinned: [...new Set(input.relatedPinned)],
    relatedHidden: [...new Set(input.relatedHidden)].filter((id) => !input.relatedPinned.includes(id)),
    narrationUrl: input.narrationUrl.trim() || null,
  };
}

export async function loadPostsAction(locale: string): Promise<ActionResult<Post[]>> {
  await requireAuthed();
  if (!isEnabledLocale(locale)) return { ok: false, error: "Unknown locale." };
  try {
    return { ok: true, data: await listPosts(locale) };
  } catch (error) {
    console.error("[admin] load posts failed", error);
    return { ok: false, error: "Could not load posts for this locale." };
  }
}

export async function savePostAction(input: PostFormInput): Promise<ActionResult<Post>> {
  await requireAuthed();
  if (!isEnabledLocale(input.locale)) return { ok: false, error: "Unknown locale." };
  if (!input.title.trim()) return { ok: false, error: "Title is required." };

  const payload = toPostInput(input);
  try {
    const post = input.id ? await updatePost(input.id, payload) : await createPost(payload);
    revalidateTag(`posts:${input.locale}`);
    return { ok: true, data: post };
  } catch (error) {
    if (error instanceof DuplicatePostSlugError) return { ok: false, error: error.message };
    console.error("[admin] save post failed", error);
    return { ok: false, error: "Could not save the post." };
  }
}

export async function deletePostAction(id: string, locale: string): Promise<ActionResult<null>> {
  await requireAuthed();
  try {
    await deletePost(id);
    revalidateTag(`posts:${locale}`);
    return { ok: true, data: null };
  } catch (error) {
    console.error("[admin] delete post failed", error);
    return { ok: false, error: "Could not delete the post." };
  }
}
