import type { PageKey } from "@/lib/blocks";

/**
 * Company pages: brand and trust pages grouped under /{locale}/about/{slug}
 * (how Mellon uses AI, process, security, ...). About is the hub. They are
 * not search-demand pages, so the landing-page demand rule does not apply.
 *
 * `draft` pages are noindex, out of the sitemap, 404 on production deploys
 * and are not linked from the About hub or service pages. Publish by setting
 * `draft: false` once every [Confirm: ...] marker in the copy is resolved.
 * Each page exists only in the locales listed; others 404.
 */
export type CompanyPage = {
  slug: string;
  key: PageKey;
  /** Short label used in breadcrumbs. */
  label: string;
  locales: string[];
  draft: boolean;
};

const englishLocales = ["en-US", "en-GB", "en-AU", "en-CA", "en-IN", "en-AE", "en-SG", "en-IE"];

export const companyPages: CompanyPage[] = [
  { slug: "ai", key: "about-ai", label: "How we use AI", locales: englishLocales, draft: true },
  { slug: "process", key: "about-process", label: "How we work", locales: englishLocales, draft: true },
  { slug: "security", key: "about-security", label: "Security and confidentiality", locales: englishLocales, draft: true },
];

export function getCompanyPage(slug: string): CompanyPage | undefined {
  return companyPages.find((page) => page.slug === slug);
}

/** Draft pages are reviewable in dev and on previews, never on production. */
export function isVisible(page: CompanyPage): boolean {
  return !page.draft || process.env.VERCEL_ENV !== "production";
}

/** Pages that are live in this locale and should be linked and listed. */
export function getPublishedCompanyPages(locale: string): CompanyPage[] {
  return companyPages.filter((page) => !page.draft && page.locales.includes(locale));
}

export function isCompanyPagePublished(locale: string, slug: string): boolean {
  return getPublishedCompanyPages(locale).some((page) => page.slug === slug);
}
