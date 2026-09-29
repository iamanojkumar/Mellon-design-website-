import { enabledLocaleCodes, getLocaleConfig } from "@/lib/locale";
import { getLocaleChain } from "@/lib/content";

/**
 * Landing pages: lead magnets and traffic pages that live outside the main
 * site structure. Routes live in `app/[locale]/(landing-pages)/<slug>/` â€” the
 * route group adds nothing to the URL, so a page is served at `/{locale}/{slug}`.
 *
 * Unlike the core pages, a landing page does NOT exist in every locale. It is
 * built only for the locales listed here; every other locale 404s. That one
 * list also drives the page's hreflang alternates and its sitemap entries, so
 * search engines are never pointed at a version that doesn't exist.
 *
 * To add one, see `app/[locale]/(landing-pages)/README.md`.
 */
export type LandingPage = {
  /** URL segment after the locale. Must not collide with a core route. */
  slug: string;
  /** Locales this page exists in. Order is irrelevant. */
  locales: string[];
  /**
   * false = live but `noindex` and left out of the sitemap. Use for paid-traffic
   * pages that would only compete with (or duplicate) an indexable page, and for
   * lead magnets that shouldn't be findable except through the campaign.
   */
  indexable: boolean;
};

export const landingPages: LandingPage[] = [
  // { slug: "free-brand-audit", locales: ["en-US"], indexable: true },
  { slug: "figma-design-system-agency-india", locales: ["en-US"], indexable: true },
  { slug: "saas-ui-design-agency-india", locales: ["en-US"], indexable: true },
  // French counterpart of the Figma design system page, with a French slug for the French market.
  { slug: "agence-design-system-figma-inde", locales: ["fr-FR"], indexable: true },
];

/** First URL segments already owned by core routes; a landing page can't reuse them. */
const RESERVED_SLUGS = new Set([
  "about",
  "contact",
  "industries",
  "privacy",
  "projects",
  "services",
]);

for (const page of landingPages) {
  if (RESERVED_SLUGS.has(page.slug)) {
    throw new Error(`Landing page slug "${page.slug}" collides with a core route`);
  }
  for (const code of page.locales) {
    if (!getLocaleConfig(code)) {
      throw new Error(`Landing page "${page.slug}" lists unknown locale "${code}"`);
    }
  }
}

export function getLandingPage(slug: string): LandingPage | undefined {
  return landingPages.find((page) => page.slug === slug);
}

/** The page's locales that are actually enabled â€” what we build and advertise. */
export function getLandingPageLocales(page: LandingPage): string[] {
  return page.locales.filter((code) => enabledLocaleCodes.includes(code));
}

/** `generateStaticParams` for a landing page route. */
export function landingPageParams(slug: string): { locale: string }[] {
  const page = getLandingPage(slug);
  if (!page) return [];
  return getLandingPageLocales(page).map((locale) => ({ locale }));
}

/**
 * A landing page's own copy, keyed by locale. A locale without an entry
 * inherits along its fallback chain (en-IN â†’ en-GB â†’ en-US), so duplicating a
 * page into another market is one line in `locales` â€” add a copy entry only
 * where the wording, currency or offer actually differs.
 */
export function resolveLandingCopy<T>(copy: Record<string, T>, locale: string): T {
  for (const code of getLocaleChain(locale)) {
    if (copy[code]) return copy[code];
  }
  throw new Error(`No landing page copy for locale "${locale}"`);
}
