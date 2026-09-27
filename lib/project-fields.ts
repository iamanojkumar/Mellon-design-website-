/**
 * Field vocabulary shared by the server data layer and the admin's client
 * components. Deliberately free of any server import so client components can
 * read these constants at runtime — lib/projects.ts is "server-only" and would
 * break the client bundle if these lived there.
 */

export const PROJECT_STATUSES = ["draft", "published", "unpublished"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/**
 * schema.org types offered for structured data. Article and BlogPosting are
 * both subtypes of CreativeWork; Google reads the latter two for Article rich
 * results, while CreativeWork is the honest generic default for a case study.
 */
export const SCHEMA_TYPES = ["CreativeWork", "Article", "BlogPosting"] as const;
export type SchemaType = (typeof SCHEMA_TYPES)[number];

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: "Draft",
  published: "Published",
  unpublished: "Unpublished",
};
