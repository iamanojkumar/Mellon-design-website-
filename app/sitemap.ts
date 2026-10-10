import type { MetadataRoute } from "next";
import { getIndustries, getServices } from "@/lib/content";
import { getPublishedCompanyPages } from "@/lib/company-pages";
import { getLandingPageLocales, landingPages } from "@/lib/landing-pages";
import { getPublishedProjects } from "@/lib/projects";
import { getPublishedPosts } from "@/lib/posts";
import { getPublishedLandingPages } from "@/lib/landing-db";
import { defaultLocale, enabledLocales } from "@/lib/locale";
import { getSiteUrl } from "@/lib/env";

/**
 * Project URLs come from Supabase, so this file is no longer purely a function
 * of the repo. Same safety net as the projects routes: publishing purges the
 * tagged fetch, and this bounds how long a build-cached result can keep a new
 * case study out of the sitemap.
 */
export const revalidate = 300;

/** Enabled locales whose own list (services or industries) contains `slug`. */
function localesWith(list: (locale: string) => { slug: string }[], slug: string): string[] {
  return enabledLocales.filter((l) => list(l.code).some((item) => item.slug === slug)).map((l) => l.code);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const entries: MetadataRoute.Sitemap = [];
  const adminLandingPages = await getPublishedLandingPages().catch((error) => {
    // Losing these entries for one build beats failing the whole sitemap.
    console.error("[sitemap] could not read admin landing pages", error);
    return [];
  });

  for (const locale of enabledLocales) {
    const localePrefix = `/${locale.code}`;
    const staticPaths = ["", "/services", "/industries", "/projects", "/about", "/contact", "/privacy"];
    // `codes` limits the alternates to locales that actually have the page: services
    // and industries are separate lists in de/es/fr/nl, so a service added to the
    // English list must not advertise a URL that 404s there.
    const alternatesFor = (path: string, codes?: string[]) => {
      const alts = codes ? enabledLocales.filter((alt) => codes.includes(alt.code)) : enabledLocales;
      return {
        languages: {
          ...Object.fromEntries(alts.map((alt) => [alt.code, `${siteUrl}/${alt.code}${path}`])),
          ...(alts.some((alt) => alt.code === defaultLocale)
            ? { "x-default": `${siteUrl}/${defaultLocale}${path}` }
            : {}),
        },
      };
    };
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
        alternates: alternatesFor(
          `/services/${service.slug}`,
          localesWith(getServices, service.slug),
        ),
      });
    }

    for (const industry of getIndustries(locale.code)) {
      entries.push({
        url: `${siteUrl}${localePrefix}/industries/${industry.slug}`,
        lastModified: new Date(),
        alternates: alternatesFor(
          `/industries/${industry.slug}`,
          localesWith(getIndustries, industry.slug),
        ),
      });
    }

    // Published company pages (/about/...) list only the locales they exist in.
    for (const page of getPublishedCompanyPages(locale.code)) {
      const path = `/about/${page.slug}`;
      entries.push({
        url: `${siteUrl}${localePrefix}${path}`,
        lastModified: new Date(),
        alternates: {
          languages: {
            ...Object.fromEntries(page.locales.map((code) => [code, `${siteUrl}/${code}${path}`])),
            ...(page.locales.includes(defaultLocale)
              ? { "x-default": `${siteUrl}/${defaultLocale}${path}` }
              : {}),
          },
        },
      });
    }

    // Landing pages exist only in the locales they list, so hreflang covers
    // just those. Non-indexable ones stay out of the sitemap entirely.
    for (const page of landingPages) {
      const pageLocales = getLandingPageLocales(page);
      if (!page.indexable || !pageLocales.includes(locale.code)) continue;
      const path = `/${page.slug}`;
      entries.push({
        url: `${siteUrl}${localePrefix}${path}`,
        lastModified: new Date(),
        alternates: {
          languages: {
            ...Object.fromEntries(
              pageLocales.map((code) => [code, `${siteUrl}/${code}${path}`]),
            ),
            ...(pageLocales.includes(defaultLocale)
              ? { "x-default": `${siteUrl}/${defaultLocale}${path}` }
              : {}),
          },
        },
      });
    }

    // Landing pages created in the admin: same rules as the code-defined ones
    // above (only their own locales in hreflang, noindex ones left out).
    for (const page of adminLandingPages) {
      if (!page.indexable || !page.locales.includes(locale.code)) continue;
      const path = `/${page.slug}`;
      entries.push({
        url: `${siteUrl}${localePrefix}${path}`,
        lastModified: new Date(page.updatedAt),
        alternates: {
          languages: {
            ...Object.fromEntries(page.locales.map((code) => [code, `${siteUrl}/${code}${path}`])),
            ...(page.locales.includes(defaultLocale)
              ? { "x-default": `${siteUrl}/${defaultLocale}${path}` }
              : {}),
          },
        },
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

    // Blog posts are per-locale writing, so like projects they carry no
    // hreflang alternates. The index is listed only once the locale has a post.
    const posts = await getPublishedPosts(locale.code);
    if (posts.length > 0) {
      entries.push({ url: `${siteUrl}${localePrefix}/blog`, lastModified: new Date(posts[0].updatedAt) });
    }
    for (const post of posts) {
      if (post.noindex) continue;
      entries.push({
        url: `${siteUrl}${localePrefix}/blog/${post.slug}`,
        lastModified: new Date(post.updatedAt),
      });
    }
  }

  return entries;
}
