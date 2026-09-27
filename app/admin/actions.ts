"use server";

import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import {
  createProject,
  updateProject,
  deleteProject,
  getProjectById,
  listProjects,
  slugify,
  DuplicateSlugError,
  type Project,
  type ProjectInput,
  type ProjectStatus,
  type SchemaType,
} from "@/lib/projects";
import {
  listFolders,
  createFolder,
  renameFolder,
  deleteFolder,
  DuplicateFolderError,
  type Folder,
} from "@/lib/folders";
import { buildProjectJsonLd, type SeoSource } from "@/lib/project-seo";
import { pruneBlocks, type ProjectBlock } from "@/lib/project-blocks";
import {
  createProjectMediaUpload,
  convertProjectMediaToAvif,
  type SignedMediaUpload,
  type ConvertedMedia,
} from "@/lib/upload-project-media";
import { isTranslationConfigured, translateProjectFields } from "@/lib/translate";
import { getLocaleConfig, isEnabledLocale } from "@/lib/locale";
import { getSiteUrl } from "@/lib/env";
import { isAdminAuthed, clearAdminSession } from "@/lib/admin-auth";
import { getIndustries, getServices, type Industry, type Service } from "@/lib/content";

export type LocaleData = {
  projects: Project[];
  folders: Folder[];
  industries: Industry[];
  services: Service[];
};

export async function loadLocaleDataAction(locale: string): Promise<ActionResult<LocaleData>> {
  await requireAuthed();
  if (!isEnabledLocale(locale)) return { ok: false, error: "Unknown locale." };

  try {
    const [projects, folders] = await Promise.all([listProjects(locale), listFolders(locale)]);
    return {
      ok: true,
      data: { projects, folders, industries: getIndustries(locale), services: getServices(locale) },
    };
  } catch (error) {
    console.error("[admin] load locale data failed", error);
    return { ok: false, error: "Could not load projects for this locale." };
  }
}

export async function createFolderAction(
  locale: string,
  name: string,
): Promise<ActionResult<Folder>> {
  await requireAuthed();
  if (!isEnabledLocale(locale)) return { ok: false, error: "Unknown locale." };
  if (!name.trim()) return { ok: false, error: "Folder name is required." };

  try {
    const folder = await createFolder(locale, name.trim());
    revalidateTag(`folders:${locale}`);
    return { ok: true, data: folder };
  } catch (error) {
    if (error instanceof DuplicateFolderError) return { ok: false, error: error.message };
    console.error("[admin] create folder failed", error);
    return { ok: false, error: "Could not create the folder." };
  }
}

export async function renameFolderAction(
  id: string,
  locale: string,
  name: string,
): Promise<ActionResult<Folder>> {
  await requireAuthed();
  if (!name.trim()) return { ok: false, error: "Folder name is required." };

  try {
    const folder = await renameFolder(id, name.trim());
    revalidateTag(`folders:${locale}`);
    return { ok: true, data: folder };
  } catch (error) {
    if (error instanceof DuplicateFolderError) return { ok: false, error: error.message };
    console.error("[admin] rename folder failed", error);
    return { ok: false, error: "Could not rename the folder." };
  }
}

/** Deleting a folder unfiles its projects; it never deletes the work inside. */
export async function deleteFolderAction(
  id: string,
  locale: string,
): Promise<ActionResult<null>> {
  await requireAuthed();

  try {
    await deleteFolder(id);
    revalidateTag(`folders:${locale}`);
    revalidateTag(`projects:${locale}`);
    return { ok: true, data: null };
  } catch (error) {
    console.error("[admin] delete folder failed", error);
    return { ok: false, error: "Could not delete the folder." };
  }
}

/**
 * Structured-data preview for the SEO panel. Runs server-side so the org facts
 * and site URL stay off the client, and so the preview is byte-identical to
 * what the public page will eventually emit.
 */
export async function previewJsonLdAction(
  locale: string,
  slug: string,
  source: SeoSource,
): Promise<ActionResult<string>> {
  await requireAuthed();
  if (!isEnabledLocale(locale)) return { ok: false, error: "Unknown locale." };

  try {
    const siteUrl = getSiteUrl();
    // Slugify here too: the caller passes `slug || title`, and an un-slugified
    // title would show a URL with spaces that never matches what Save writes.
    const canonical = `${siteUrl}/${locale}/work/${slug ? slugify(slug) : "example-slug"}`;
    const jsonLd = buildProjectJsonLd(siteUrl, locale, canonical, source);
    return { ok: true, data: JSON.stringify(jsonLd, null, 2) };
  } catch (error) {
    console.error("[admin] json-ld preview failed", error);
    return { ok: false, error: "Could not build the structured-data preview." };
  }
}

async function requireAuthed() {
  if (!(await isAdminAuthed())) redirect("/admin/login");
}

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type ProjectFormInput = {
  id: string | null;
  locale: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  service: string;
  heroImage: string;
  heroImageAlt: string;
  heroImageWidth: number | null;
  heroImageHeight: number | null;
  content: string;
  blocks: ProjectBlock[];
  featured: boolean;
  folderId: string | null;
  status: ProjectStatus;
  metaTitle: string;
  metaDescription: string;
  noindex: boolean;
  focusKeyword: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  schemaType: SchemaType;
  jsonLdOverride: string;
  customHead: string;
  customBody: string;
};

/** Form strings -> the nullable row shape lib/projects.ts stores. */
function toProjectInput(input: ProjectFormInput): ProjectInput {
  return {
    locale: input.locale,
    slug: slugify(input.slug.trim() || input.title),
    title: input.title.trim(),
    summary: input.summary.trim() || null,
    category: input.category,
    service: input.service,
    heroImage: input.heroImage.trim() || null,
    heroImageAlt: input.heroImageAlt.trim() || null,
    heroImageWidth: input.heroImageWidth,
    heroImageHeight: input.heroImageHeight,
    content: input.content,
    // Half-filled rows never reach the page or the markup.
    blocks: pruneBlocks(input.blocks),
    featured: input.featured,
    folderId: input.folderId,
    status: input.status,
    metaTitle: input.metaTitle.trim() || null,
    metaDescription: input.metaDescription.trim() || null,
    noindex: input.noindex,
    focusKeyword: input.focusKeyword.trim() || null,
    canonicalUrl: input.canonicalUrl.trim() || null,
    ogTitle: input.ogTitle.trim() || null,
    ogDescription: input.ogDescription.trim() || null,
    ogImage: input.ogImage.trim() || null,
    schemaType: input.schemaType,
    jsonLdOverride: input.jsonLdOverride.trim() || null,
    customHead: input.customHead.trim() || null,
    customBody: input.customBody.trim() || null,
  };
}

async function createWithUniqueSlug(input: ProjectInput): Promise<Project> {
  try {
    return await createProject(input);
  } catch (error) {
    if (error instanceof DuplicateSlugError) {
      return createProject({ ...input, slug: `${input.slug}-${input.locale.toLowerCase()}` });
    }
    throw error;
  }
}

export async function saveProjectAction(
  input: ProjectFormInput,
): Promise<ActionResult<Project>> {
  await requireAuthed();

  if (!isEnabledLocale(input.locale)) return { ok: false, error: "Unknown locale." };
  if (!input.title.trim()) return { ok: false, error: "Title is required." };
  if (!input.category) return { ok: false, error: "Category is required." };
  if (!input.service) return { ok: false, error: "Service is required." };

  if (input.jsonLdOverride.trim()) {
    try {
      JSON.parse(input.jsonLdOverride);
    } catch {
      return { ok: false, error: "Custom JSON-LD is not valid JSON." };
    }
  }

  const payload = toProjectInput(input);

  try {
    const project = input.id
      ? await updateProject(input.id, payload)
      : await createProject(payload);
    revalidateTag(`projects:${input.locale}`);
    return { ok: true, data: project };
  } catch (error) {
    if (error instanceof DuplicateSlugError) return { ok: false, error: error.message };
    console.error("[admin] save project failed", error);
    return { ok: false, error: "Could not save the project." };
  }
}

export async function deleteProjectAction(
  id: string,
  locale: string,
): Promise<ActionResult<null>> {
  await requireAuthed();
  try {
    await deleteProject(id);
    revalidateTag(`projects:${locale}`);
    return { ok: true, data: null };
  } catch (error) {
    console.error("[admin] delete project failed", error);
    return { ok: false, error: "Could not delete the project." };
  }
}

/**
 * Hands the browser a short-lived, path-scoped URL to PUT a file straight to
 * Supabase Storage. The bytes never pass through this action — see
 * lib/upload-project-media.ts for why (Vercel's 4.5MB function body cap).
 */
export async function createMediaUploadAction(meta: {
  filename: string;
  size: number;
  type: string;
}): Promise<ActionResult<SignedMediaUpload>> {
  await requireAuthed();
  try {
    return { ok: true, data: await createProjectMediaUpload(meta) };
  } catch (error) {
    console.error("[admin] could not sign media upload", error);
    return { ok: false, error: error instanceof Error ? error.message : "Upload failed." };
  }
}

/**
 * Compresses a just-uploaded image to AVIF in place. Called after the browser's
 * direct PUT, because the bytes have to reach Storage before the server can
 * read them without tripping the function body limit.
 */
export async function convertMediaToAvifAction(
  publicUrl: string,
): Promise<ActionResult<ConvertedMedia>> {
  await requireAuthed();
  try {
    return { ok: true, data: await convertProjectMediaToAvif(publicUrl) };
  } catch (error) {
    console.error("[admin] avif conversion rejected", error);
    return { ok: false, error: error instanceof Error ? error.message : "Conversion failed." };
  }
}

export async function duplicateProjectAction(
  sourceId: string,
  targetLocale: string,
): Promise<ActionResult<Project>> {
  await requireAuthed();

  if (!isEnabledLocale(targetLocale)) return { ok: false, error: "Unknown target locale." };
  if (!isTranslationConfigured()) {
    return { ok: false, error: "Set DEEPSEEK_API_KEY to enable translation." };
  }

  const source = await getProjectById(sourceId);
  if (!source) return { ok: false, error: "Source project not found." };
  if (source.locale === targetLocale) {
    return { ok: false, error: "Pick a different locale to duplicate into." };
  }

  const targetLanguage = getLocaleConfig(targetLocale)?.label ?? targetLocale;

  let translated;
  try {
    translated = await translateProjectFields(
      { title: source.title, summary: source.summary, content: source.content },
      targetLanguage,
    );
  } catch (error) {
    console.error("[admin] translation failed", error);
    return { ok: false, error: error instanceof Error ? error.message : "Translation failed." };
  }

  try {
    const project = await createWithUniqueSlug({
      locale: targetLocale,
      slug: slugify(translated.title),
      title: translated.title,
      summary: translated.summary,
      content: translated.content,
      // Taxonomy slugs are stable across locales (same slug, translated name),
      // so these carry over as-is.
      category: source.category,
      service: source.service,
      heroImage: source.heroImage,
      // Dimensions travel with the image; the alt text is prose, so it is
      // re-written per locale rather than carried over in the source language.
      heroImageWidth: source.heroImageWidth,
      heroImageHeight: source.heroImageHeight,
      heroImageAlt: null,
      featured: source.featured,
      // Blocks carry untranslated prose; kept so structure survives the copy,
      // flagged in the UI as needing a pass.
      blocks: source.blocks,
      schemaType: source.schemaType,
      noindex: source.noindex,
      customHead: source.customHead,
      customBody: source.customBody,
      // Folders are per-locale rows, so the source's folder means nothing here.
      folderId: null,
      // A fresh machine translation starts as a draft for review, never live.
      status: "draft",
      // Everything below is locale-specific prose or a locale-specific URL.
      // Carrying the source's across would put English text on a German page;
      // left empty, OG fields fall back to the translated title/summary.
      canonicalUrl: null,
      focusKeyword: null,
      metaTitle: null,
      metaDescription: null,
      ogTitle: null,
      ogDescription: null,
      ogImage: source.ogImage,
      jsonLdOverride: null,
    });
    revalidateTag(`projects:${targetLocale}`);
    return { ok: true, data: project };
  } catch (error) {
    console.error("[admin] duplicate project failed", error);
    return { ok: false, error: "Could not create the duplicated project." };
  }
}

export async function logoutAction(): Promise<void> {
  await clearAdminSession();
  redirect("/admin/login");
}
