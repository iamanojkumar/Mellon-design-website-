"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import {
  createLandingPage,
  updateLandingPage,
  deleteLandingPage,
  listLandingPages,
  DuplicateLandingSlugError,
  type LandingInput,
  type LandingRow,
  type LandingStatus,
} from "@/lib/landing-db";
import {
  checkLandingRules,
  coerceLandingCopy,
  slugifyLanding,
  SLUG_PATTERN,
  type LandingCopy,
  type OtherPage,
} from "@/lib/landing-content";
import { RESERVED_SLUGS, landingPages } from "@/lib/landing-pages";
import { CODE_LANDING_SLUGS } from "@/lib/landing-code-pages";
import { getOtherLandingPages } from "@/lib/landing-others";
import { getLocaleConfig, isEnabledLocale } from "@/lib/locale";
import { isAdminAuthed } from "@/lib/admin-auth";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type LandingFormInput = {
  id: string | null;
  slug: string;
  locale: string;
  locales: string[];
  status: LandingStatus;
  indexable: boolean;
  service: string;
  demandNote: string;
  copy: LandingCopy;
  /** Publish even though a rule check fails (a deliberate, recorded choice). */
  overrideRules?: boolean;
};

async function requireAuthed() {
  if (!(await isAdminAuthed())) redirect("/admin/login");
}

export async function loadLandingPagesAction(): Promise<ActionResult<LandingRow[]>> {
  await requireAuthed();
  try {
    return { ok: true, data: await listLandingPages() };
  } catch (error) {
    console.error("[admin] load landing pages failed", error);
    return { ok: false, error: "Could not load landing pages." };
  }
}

/** Other pages' identifying copy, for the live rule checks beside the editor. */
export async function loadOtherPagesAction(excludeId: string | null): Promise<ActionResult<OtherPage[]>> {
  await requireAuthed();
  try {
    return { ok: true, data: await getOtherLandingPages(excludeId) };
  } catch (error) {
    console.error("[admin] load other landing pages failed", error);
    return { ok: false, error: "Could not load the other landing pages." };
  }
}

export async function saveLandingAction(input: LandingFormInput): Promise<ActionResult<LandingRow>> {
  await requireAuthed();

  const slug = slugifyLanding(input.slug);
  if (!slug || !SLUG_PATTERN.test(slug)) return { ok: false, error: "Give the page a slug." };
  if (
    RESERVED_SLUGS.has(slug) ||
    CODE_LANDING_SLUGS.includes(slug) ||
    slug === "lp-smoke" ||
    landingPages.some((page) => page.slug === slug)
  ) {
    return { ok: false, error: `"${slug}" is already used by another page.` };
  }

  if (!isEnabledLocale(input.locale)) return { ok: false, error: "Unknown locale." };
  const language = getLocaleConfig(input.locale)?.language;
  const locales = [...new Set([input.locale, ...input.locales])].filter(isEnabledLocale);
  const mismatched = locales.filter((code) => getLocaleConfig(code)?.language !== language);
  if (mismatched.length) {
    return {
      ok: false,
      error: `${mismatched.join(", ")} use a different language from ${input.locale}. A page can only be served in locales that share its copy's language.`,
    };
  }

  const copy = coerceLandingCopy(input.copy);

  if (input.status === "published") {
    const results = checkLandingRules({
      copy,
      slug,
      indexable: input.indexable,
      demandNote: input.demandNote,
      others: await getOtherLandingPages(input.id),
    });
    const failures = results.filter((r) => r.status === "fail");
    if (failures.length && !input.overrideRules) {
      return {
        ok: false,
        error: `Not published. Fix: ${failures.map((f) => `${f.label} (${f.detail})`).join("; ")}.`,
      };
    }
  }

  const payload: LandingInput = {
    slug,
    locale: input.locale,
    locales,
    status: input.status,
    indexable: input.indexable,
    service: input.service.trim() || null,
    demandNote: input.demandNote.trim() || null,
    copy,
  };

  try {
    const saved = input.id ? await updateLandingPage(input.id, payload) : await createLandingPage(payload);
    revalidateTag("landing");
    return { ok: true, data: saved };
  } catch (error) {
    if (error instanceof DuplicateLandingSlugError) return { ok: false, error: error.message };
    console.error("[admin] save landing page failed", error);
    return { ok: false, error: "Could not save the page." };
  }
}

export async function deleteLandingAction(id: string): Promise<ActionResult<null>> {
  await requireAuthed();
  try {
    await deleteLandingPage(id);
    revalidateTag("landing");
    return { ok: true, data: null };
  } catch (error) {
    console.error("[admin] delete landing page failed", error);
    return { ok: false, error: "Could not delete the page." };
  }
}
