import type { MetadataRoute } from "next";
import { getIndustries, getServices } from "@/lib/content";
import { getPublishedProjects } from "@/lib/projects";
import { defaultLocale, enabledLocales } from "@/lib/locale";
import { getSiteUrl } from "@/lib/env";

/**
 * Project URLs come from Supabase, so this file is no longer purely a function
 * of the repo. Same safety net as the projects routes: publishing purges the
 * tagged fetch, and this bounds how long a build-cached result can keep a new
 * case study out of the sitemap.
 */
export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of enabledLocales) {
    const localePrefix = `/${locale.code}`;
    const staticPaths = ["", "/services", "/industries", "/projects", "/about", "/contact", "/privacy"];
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

    // Case studies are per-locale rows with no cross-locale counterpart, so
    // unlike the pages above they carry no hreflang alternates: the same slug
    // in another locale is usually different work, or nothing at all.
    // A noindex project is live but deliberately kept out of search.
    for (const project of await getPublishedProjects(locale.code)) {
      if (project.noindex) continue;
      entries.push({
        url: `${siteUrl}${localePrefix}/projects/${project.slug}`,
        lastModified: new Date(project.updatedAt),
      });
    }
  }

  return entries;
}
