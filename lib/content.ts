import type { PageDoc, PageKey } from "@/lib/blocks";
import { contentRegistry, type SiteContent } from "@/content/registry";
import { defaultLocale, getLocaleConfig } from "@/lib/locale";

export type { SiteContent };

export type Service = {
  slug: string;
  name: string;
  tagline: string;
  summary: string;
  deliverables: string[];
  relatedIndustries: string[];
};

export type Industry = {
  slug: string;
  name: string;
  tagline: string;
  summary: string;
  deliverables: string[];
  relatedServices: string[];
};

/**
 * Inheritance chain for a locale: itself, then its `fallback` (and that
 * locale's fallback, ...), always ending at the default locale.
 * e.g. de-CH -> de-DE -> en-US.
 */
export function getLocaleChain(locale: string): string[] {
  const chain: string[] = [];
  let current: string | undefined = locale;
  while (current && !chain.includes(current)) {
    chain.push(current);
    current = getLocaleConfig(current)?.fallback;
  }
  if (!chain.includes(defaultLocale)) chain.push(defaultLocale);
  return chain;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Objects merge key by key; arrays and primitives from `override` replace. */
function deepMerge<T>(base: T, override: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return (override === undefined ? base : override) as T;
  }
  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    result[key] = deepMerge(result[key], value);
  }
  return result as T;
}

const siteCache = new Map<string, SiteContent>();

/** Global strings (nav, footer, forms, ...): deep-merged along the chain. */
export function getSiteContent(locale: string): SiteContent {
  const cached = siteCache.get(locale);
  if (cached) return cached;

  const chain = getLocaleChain(locale);
  let merged: unknown = undefined;
  for (const code of [...chain].reverse()) {
    const site = contentRegistry[code]?.site;
    if (site) merged = merged === undefined ? site : deepMerge(merged, site);
  }
  if (merged === undefined) {
    throw new Error(`No site content for locale "${locale}"`);
  }
  siteCache.set(locale, merged as SiteContent);
  return merged as SiteContent;
}

function firstInChain<T>(
  locale: string,
  pick: (code: string) => T | undefined,
): T | undefined {
  for (const code of getLocaleChain(locale)) {
    const found = pick(code);
    if (found !== undefined) return found;
  }
  return undefined;
}

/** A page doc: the locale's own if it has one, otherwise inherited whole. */
export function getPage(locale: string, key: PageKey): PageDoc {
  const page = firstInChain(locale, (code) => contentRegistry[code]?.pages?.[key]);
  if (!page) throw new Error(`No "${key}" page for locale "${locale}"`);
  return page;
}

export function getServices(locale: string): Service[] {
  return (firstInChain(locale, (code) => contentRegistry[code]?.services) ??
    []) as Service[];
}

export function getService(locale: string, slug: string): Service | undefined {
  return getServices(locale).find((service) => service.slug === slug);
}

export function getIndustries(locale: string): Industry[] {
  return (firstInChain(locale, (code) => contentRegistry[code]?.industries) ??
    []) as Industry[];
}

export function getIndustry(
  locale: string,
  slug: string,
): Industry | undefined {
  return getIndustries(locale).find((industry) => industry.slug === slug);
}
