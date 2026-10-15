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
  /** Short label used in breadcrumbs (English fallback). */
  label: string;
  /** Per-locale breadcrumb label; falls back to `label` for a locale not listed here. */
  labels?: Record<string, string>;
  locales: string[];
  draft: boolean;
};

const englishLocales = ["en-US", "en-GB", "en-AU", "en-CA", "en-IN", "en-AE", "en-SG", "en-IE"];
const allLocales = [...englishLocales, "de-DE", "es-ES", "fr-FR", "nl-NL"];

export const companyPages: CompanyPage[] = [
  {
    slug: "ai",
    key: "about-ai",
    label: "How we use AI",
    labels: {
      "de-DE": "Wie wir KI nutzen",
      "es-ES": "Cómo usamos la IA",
      "fr-FR": "Comment nous utilisons l'IA",
      "nl-NL": "Hoe we AI gebruiken",
    },
    locales: allLocales,
    draft: false,
  },
  {
    slug: "process",
    key: "about-process",
    label: "How we work",
    labels: {
      "de-DE": "Wie wir arbeiten",
      "es-ES": "Cómo trabajamos",
      "fr-FR": "Notre façon de travailler",
      "nl-NL": "Hoe we werken",
    },
    locales: allLocales,
    draft: false,
  },
  {
    slug: "security",
    key: "about-security",
    label: "Security and confidentiality",
    labels: {
      "de-DE": "Sicherheit und Vertraulichkeit",
      "es-ES": "Seguridad y confidencialidad",
      "fr-FR": "Sécurité et confidentialité",
      "nl-NL": "Beveiliging en vertrouwelijkheid",
    },
    locales: allLocales,
    draft: false,
  },
  {
    slug: "sustainability",
    key: "about-sustainability",
    label: "Sustainability and affordability",
    labels: {
      "de-DE": "Nachhaltigkeit und Erschwinglichkeit",
      "es-ES": "Sostenibilidad y asequibilidad",
      "fr-FR": "Durabilité et accessibilité financière",
      "nl-NL": "Duurzaamheid en betaalbaarheid",
    },
    locales: allLocales,
    draft: false,
  },
];

export function getCompanyPage(slug: string): CompanyPage | undefined {
  return companyPages.find((page) => page.slug === slug);
}

/** Breadcrumb label for a locale, falling back to the English `label`. */
export function getCompanyPageLabel(page: CompanyPage, locale: string): string {
  return page.labels?.[locale] ?? page.label;
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
