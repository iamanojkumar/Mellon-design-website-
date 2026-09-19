import type { MetadataRoute } from "next";
import { getSiteUrl, isProductionDeployment } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  const isProd = isProductionDeployment();

  return {
    rules: {
      userAgent: "*",
      allow: isProd ? "/" : undefined,
      disallow: isProd ? undefined : "/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
