import type { MetadataRoute } from "next";
import { getIndustries, getServices } from "@/lib/content";
import { defaultLocale, enabledLocales } from "@/lib/locale";
import { getSiteUrl } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of enabledLocales) {
    const localePrefix = `/${locale.code}`;
    const staticPaths = ["", "/services", "/industries", "/about", "/contact", "/privacy"];
    const alternatesFor = (path: string) => ({
      languages: {
        ...Object.fromEntries(
          enabledLocales.map((alt) => [alt.code, `${siteUrl}/${alt.code}${path}`]),
        ),
        "x-default": `${siteUrl}/${defaultLocale}${path}`,
      },
    });
    for (const path of staticPaths) {
      entries.push({
        url: `${siteUrl}${localePrefix}${path}`,
        lastModified: new Date(),
        alternates: alternatesFor(path),
      });
    }

    for (const service of getServices(locale.code)) {
      entries.push({
        url: `${siteUrl}${localePrefix}/services/${service.slug}`,
        lastModified: new Date(),
        alternates: alternatesFor(`/services/${service.slug}`),
      });
    }

    for (const industry of getIndustries(locale.code)) {
      entries.push({
        url: `${siteUrl}${localePrefix}/industries/${industry.slug}`,
        lastModified: new Date(),
        alternates: alternatesFor(`/industries/${industry.slug}`),
      });
    }
  }

  return entries;
}
