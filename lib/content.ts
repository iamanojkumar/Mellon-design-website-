import siteEnUS from "@/content/en-US/site.json";
import servicesEnUS from "@/content/en-US/services.json";
import industriesEnUS from "@/content/en-US/industries.json";

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

export type SiteContent = typeof siteEnUS;

type LocaleContentBundle = {
  site: SiteContent;
  services: Service[];
  industries: Industry[];
};

const contentByLocale: Record<string, LocaleContentBundle> = {
  "en-US": {
    site: siteEnUS,
    services: servicesEnUS as Service[],
    industries: industriesEnUS as Industry[],
  },
};

function getBundle(locale: string): LocaleContentBundle {
  const bundle = contentByLocale[locale];
  if (!bundle) {
    throw new Error(`No content bundle for locale "${locale}"`);
  }
  return bundle;
}

export function getSiteContent(locale: string): SiteContent {
  return getBundle(locale).site;
}

export function getServices(locale: string): Service[] {
  return getBundle(locale).services;
}

export function getService(locale: string, slug: string): Service | undefined {
  return getServices(locale).find((service) => service.slug === slug);
}

export function getIndustries(locale: string): Industry[] {
  return getBundle(locale).industries;
}

export function getIndustry(
  locale: string,
  slug: string,
): Industry | undefined {
  return getIndustries(locale).find((industry) => industry.slug === slug);
}
