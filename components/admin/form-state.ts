import type { Project } from "@/lib/projects";
import type { ProjectStatus, SchemaType } from "@/lib/project-fields";
import type { ProjectBlock } from "@/lib/project-blocks";

/**
 * The editor's in-memory shape. Lives in AdminApp so every panel (core editor,
 * SEO, Advanced, AI assistant) reads and writes the same draft — the AI can
 * propose into it without anything being persisted until Save.
 *
 * All strings, never null: empty string is the "not set" value in a form, and
 * app/admin/actions.ts converts back to nulls on the way to the database.
 */
export type ProjectFormState = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  service: string;
  heroImage: string;
  heroImageAlt: string;
  /** Detected from the image itself; "" until one loads. */
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

export const blankForm: ProjectFormState = {
  slug: "",
  title: "",
  summary: "",
  category: "",
  service: "",
  heroImage: "",
  heroImageAlt: "",
  heroImageWidth: null,
  heroImageHeight: null,
  content: "",
  blocks: [],
  featured: false,
  folderId: null,
  status: "draft",
  metaTitle: "",
  metaDescription: "",
  noindex: false,
  focusKeyword: "",
  canonicalUrl: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  schemaType: "CreativeWork",
  jsonLdOverride: "",
  customHead: "",
  customBody: "",
};

export function toForm(project: Project | null): ProjectFormState {
  if (!project) return blankForm;
  return {
    slug: project.slug,
    title: project.title,
    summary: project.summary ?? "",
    category: project.category,
    service: project.service,
    heroImage: project.heroImage ?? "",
    heroImageAlt: project.heroImageAlt ?? "",
    heroImageWidth: project.heroImageWidth,
    heroImageHeight: project.heroImageHeight,
    content: project.content,
    blocks: project.blocks,
    featured: project.featured,
    folderId: project.folderId,
    status: project.status,
    metaTitle: project.metaTitle ?? "",
    metaDescription: project.metaDescription ?? "",
    noindex: project.noindex,
    focusKeyword: project.focusKeyword ?? "",
    canonicalUrl: project.canonicalUrl ?? "",
    ogTitle: project.ogTitle ?? "",
    ogDescription: project.ogDescription ?? "",
    ogImage: project.ogImage ?? "",
    schemaType: project.schemaType,
    jsonLdOverride: project.jsonLdOverride ?? "",
    customHead: project.customHead ?? "",
    customBody: project.customBody ?? "",
  };
}

