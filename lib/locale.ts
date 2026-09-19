import localesConfig from "@/content/locales.json";

export type LocaleConfig = {
  code: string;
  language: string;
  market: string;
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

/**
 * Picks the best enabled locale for a browser Accept-Language header.
 * Only ever returns a locale that is actually enabled, falling back to
 * defaultLocale — adding a new market is purely a content + config change.
 */
export function resolveLocaleFromAcceptLanguage(
  acceptLanguage: string | null,
): string {
  if (!acceptLanguage) return defaultLocale;

  const requested = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, qValue] = part.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: qValue ? parseFloat(qValue) : 1 };
    })
    .sort((a, b) => b.q - a.q);

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
