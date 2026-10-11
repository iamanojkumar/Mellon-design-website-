import type { MetadataRoute } from "next";
import { getSiteUrl, isProductionDeployment } from "@/lib/env";
import { AI_CRAWLERS, AI_MEDIA_DISALLOW } from "@/lib/ai-policy";

/** Private routes: no crawl value, and never in the sitemap. */
const PRIVATE_PATHS = ["/admin", "/admin/"];

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  const isProd = isProductionDeployment();

  return {
    rules: [
      {
        userAgent: "*",
        allow: isProd ? "/" : undefined,
        // Preview deployments hide everything; production hides only the admin.
        // The admin also serves `noindex, nofollow` itself, which is what actually
        // keeps it out of the index — a Disallow alone can still leave a bare URL
        // indexed if something links to it, because the crawler never reads the tag.
        disallow: isProd ? PRIVATE_PATHS : "/",
      },
      {
        // AI crawlers may read the text pages and nothing else: no audio, video,
        // images or brand files. A group naming an agent replaces the "*" group
        // for it, so the admin paths are repeated here. See public/ai.txt.
        userAgent: [...AI_CRAWLERS],
        allow: isProd ? "/" : undefined,
        disallow: isProd ? [...PRIVATE_PATHS, ...AI_MEDIA_DISALLOW] : "/",
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
