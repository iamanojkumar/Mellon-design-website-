import type { MetadataRoute } from "next";
import { getSiteUrl, isProductionDeployment } from "@/lib/env";

/** Private routes: no crawl value, and never in the sitemap. */
const PRIVATE_PATHS = ["/admin", "/admin/"];

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  const isProd = isProductionDeployment();

  return {
    rules: {
      userAgent: "*",
      allow: isProd ? "/" : undefined,
      // Preview deployments hide everything; production hides only the admin.
      // The admin also serves `noindex, nofollow` itself, which is what actually
      // keeps it out of the index — a Disallow alone can still leave a bare URL
      // indexed if something links to it, because the crawler never reads the tag.
      disallow: isProd ? PRIVATE_PATHS : "/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
