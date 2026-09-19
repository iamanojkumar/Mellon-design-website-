import type { MetadataRoute } from "next";
import { getIndustries, getServices } from "@/lib/content";
import { enabledLocales } from "@/lib/locale";
import { getSiteUrl } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of enabledLocales) {
    const localePrefix = `/${locale.code}`;
    const languages: Record<string, string> = {};
    for (const alt of enabledLocales) {
      languages[alt.code] = `${siteUrl}/${alt.code}`;
    }

    const staticPaths = ["", "/services", "/industries", "/about", "/contact"];
    for (const path of staticPaths) {
      entries.push({
        url: `${siteUrl}${localePrefix}${path}`,
        lastModified: new Date(),
        alternates: { languages },
      });
    }

    for (const service of getServices(locale.code)) {
      entries.push({
        url: `${siteUrl}${localePrefix}/services/${service.slug}`,
        lastModified: new Date(),
      });
    }

    for (const industry of getIndustries(locale.code)) {
      entries.push({
        url: `${siteUrl}${localePrefix}/industries/${industry.slug}`,
        lastModified: new Date(),
      });
    }
  }

  return entries;
}
