"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-auth";
import { isEnabledLocale } from "@/lib/locale";
import { getIndustries, getServices } from "@/lib/content";
import { listProjects } from "@/lib/projects";
import {
  listRelatedOverrides,
  saveRelatedOverride,
  type RelatedKind,
  type RelatedOverride,
} from "@/lib/related-work";
import type { RelatedPicks } from "@/lib/related-pick";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type RelatedProjectLite = {
  id: string;
  title: string;
  service: string;
  alsoServices: string[];
  category: string;
};

export type RelatedPage = { kind: RelatedKind; slug: string; name: string };

export type RelatedData = {
  /** Published projects only: the only ones the site can show. */
  projects: RelatedProjectLite[];
  pages: RelatedPage[];
  overrides: RelatedOverride[];
};

async function requireAuthed() {
  if (!(await isAdminAuthed())) redirect("/admin/login");
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function loadRelatedAction(locale: string): Promise<ActionResult<RelatedData>> {
  await requireAuthed();
  if (!isEnabledLocale(locale)) return { ok: false, error: "Unknown locale." };
  try {
    const [projects, overrides] = await Promise.all([
      listProjects(locale),
      // Before the migration is applied the table does not exist; the screen
      // still opens, and saving then reports the real error.
      listRelatedOverrides(locale).catch(() => [] as RelatedOverride[]),
    ]);
    return {
      ok: true,
      data: {
        projects: projects
          .filter((project) => project.status === "published")
          .map((project) => ({
            id: project.id,
            title: project.title,
            service: project.service,
            alsoServices: project.alsoServices,
            category: project.category,
          })),
        pages: [
          ...getServices(locale).map((service) => ({
            kind: "service" as const,
            slug: service.slug,
            name: service.name,
          })),
          ...getIndustries(locale).map((industry) => ({
            kind: "industry" as const,
            slug: industry.slug,
            name: industry.name,
          })),
        ],
        overrides,
      },
    };
  } catch (error) {
    console.error("[admin] load related work failed", error);
    return { ok: false, error: "Could not load related work for this locale." };
  }
}

export async function saveRelatedAction(
  locale: string,
  kind: RelatedKind,
  slug: string,
  picks: RelatedPicks,
): Promise<ActionResult<RelatedOverride>> {
  await requireAuthed();
  if (!isEnabledLocale(locale)) return { ok: false, error: "Unknown locale." };
  const known =
    kind === "service"
      ? getServices(locale).some((service) => service.slug === slug)
      : kind === "industry"
        ? getIndustries(locale).some((industry) => industry.slug === slug)
        : false;
  if (!known) return { ok: false, error: "Unknown page." };

  const clean = (ids: string[]) => [...new Set(ids.filter((id) => UUID.test(id)))];
  try {
    const saved = await saveRelatedOverride(locale, kind, slug, {
      pinned: clean(picks.pinned),
      hidden: clean(picks.hidden),
    });
    revalidateTag(`projects:${locale}`);
    return { ok: true, data: saved };
  } catch (error) {
    console.error("[admin] save related work failed", error);
    return { ok: false, error: "Could not save. Has the latest database migration been applied?" };
  }
}
