import type { Metadata } from "next";
import { enabledLocales } from "@/lib/locale";
import { getSiteUrl } from "@/lib/env";

type BuildMetadataArgs = {
  locale: string;
  path: string; // path within the locale, e.g. "" | "/services" | "/services/branding"
  title: string;
  description: string;
  ogImage?: string;
};

export function buildMetadata({
  locale,
  path,
  title,
  description,
  ogImage = "/images/Mellon-hero-banner.webp",
}: BuildMetadataArgs): Metadata {
  const siteUrl = getSiteUrl();
  const canonicalPath = `/${locale}${path}`;
  const canonical = `${siteUrl}${canonicalPath}`;

  const languages: Record<string, string> = {};
  for (const alt of enabledLocales) {
    languages[alt.code] = `${siteUrl}/${alt.code}${path}`;
  }

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Mellon",
      images: [{ url: ogImage }],
      locale: locale.replace("-", "_"),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export function organizationJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Mellon",
    url: siteUrl,
    logo: `${siteUrl}/brand/icon_color.png`,
    sameAs: [
      "https://instagram.com/mellon.design",
      "https://linkedin.com/company/mellon-design",
      "https://x.com/mellon_design",
    ],
  };
}

export function breadcrumbJsonLd(
  siteUrl: string,
  items: { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`,
    })),
  };
}

export function serviceJsonLd(
  siteUrl: string,
  service: { name: string; summary: string },
  path: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.summary,
    url: `${siteUrl}${path}`,
    provider: {
      "@type": "Organization",
      name: "Mellon",
      url: siteUrl,
    },
  };
}
