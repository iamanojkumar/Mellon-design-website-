import localesConfig from "@/content/locales.json";

export type LocaleConfig = {
  code: string;
  language: string;
  market: string;
  country: string;
  /** Optional locale-specific social preview image; falls back to the default. */
  ogImage?: string;
  /** Locale to inherit missing content from (defaults to defaultLocale). */
  fallback?: string;
  label: string;
  enabled: boolean;
};

export const defaultLocale: string = localesConfig.defaultLocale;

export const allLocales: LocaleConfig[] = localesConfig.locales;

export const enabledLocales: LocaleConfig[] = allLocales.filter(
  (locale) => locale.enabled,
);

export const enabledLocaleCodes: string[] = enabledLocales.map(
  (locale) => locale.code,
);

export function isEnabledLocale(code: string): boolean {
  return enabledLocaleCodes.includes(code);
}

export function getLocaleConfig(code: string): LocaleConfig | undefined {
  return allLocales.find((locale) => locale.code === code);
}

/** Accept-Language, parsed into tags ordered by descending q-value. */
function parseAcceptLanguage(acceptLanguage: string | null): { tag: string; q: number }[] {
  if (!acceptLanguage) return [];
  return acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, qValue] = part.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: qValue ? parseFloat(qValue) : 1 };
    })
    .sort((a, b) => b.q - a.q);
}

/**
 * Picks the best enabled locale for a visitor's country, from the CDN's
 * geo-IP lookup.
 *
 * This exists because Accept-Language cannot answer the question. It states a
 * *language* preference, not a location: a browser in India overwhelmingly
 * sends `en-GB` or `en-US`, almost never `en-IN`. Since every locale here is a
 * country-market rather than a language, geography is the better signal for
 * which one to serve, and the visitor's language only breaks ties.
 *
 * `market` is already the ISO country code (see content/locales.json), so no
 * separate country→locale table is needed.
 *
 * Returns null when the country has no enabled locale, so the caller can fall
 * through to Accept-Language rather than being forced to a wrong market.
 */
export function resolveLocaleFromCountry(
  country: string | null | undefined,
  acceptLanguage: string | null,
): string | null {
  if (!country) return null;
  const candidates = enabledLocales.filter(
    (locale) => locale.market.toUpperCase() === country.toUpperCase(),
  );
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0].code;

  // More than one locale serves this country (Canada would be en-CA/fr-CA,
  // Switzerland de-CH/fr-CH). Geography picked the market; language picks
  // which of that market's locales to open in.
  for (const { tag } of parseAcceptLanguage(acceptLanguage)) {
    const language = tag.split("-")[0];
    const match = candidates.find((locale) => locale.language === language);
    if (match) return match.code;
  }
  return candidates[0].code;
}

/**
 * Picks the best enabled locale for a browser Accept-Language header.
 * Only ever returns a locale that is actually enabled, falling back to
 * defaultLocale — adding a new market is purely a content + config change.
 */
export function resolveLocaleFromAcceptLanguage(
  acceptLanguage: string | null,
): string {
  if (!acceptLanguage) return defaultLocale;

  const requested = parseAcceptLanguage(acceptLanguage);

  for (const { tag } of requested) {
    const exact = enabledLocales.find(
      (locale) => locale.code.toLowerCase() === tag,
    );
    if (exact) return exact.code;

    const languageOnly = tag.split("-")[0];
    const byLanguage = enabledLocales.find(
      (locale) => locale.language === languageOnly,
    );
    if (byLanguage) return byLanguage.code;
  }

  return defaultLocale;
}
