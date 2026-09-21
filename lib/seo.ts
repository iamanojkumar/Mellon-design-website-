import type { Metadata } from "next";
import { defaultLocale, enabledLocales, getLocaleConfig } from "@/lib/locale";
import { getSiteUrl } from "@/lib/env";
import { getServices, getSiteContent } from "@/lib/content";
import organization from "@/content/organization.json";

type BuildMetadataArgs = {
  locale: string;
  path: string; // path within the locale, e.g. "" | "/services" | "/services/branding"
  title: string;
  description: string;
  ogImage?: string;
};

// Shown whenever a page (or its locale) has no image of its own.
export const DEFAULT_OG_IMAGE = "/brand/icon_color_lightbg.png";

export function buildMetadata({
  locale,
  path,
  title,
  description,
  ogImage,
}: BuildMetadataArgs): Metadata {
  const siteUrl = getSiteUrl();
  const image = ogImage ?? getLocaleConfig(locale)?.ogImage ?? DEFAULT_OG_IMAGE;
  const canonicalPath = `/${locale}${path}`;
  const canonical = `${siteUrl}${canonicalPath}`;

  const languages: Record<string, string> = {};
  for (const alt of enabledLocales) {
    languages[alt.code] = `${siteUrl}/${alt.code}${path}`;
  }
  languages["x-default"] = `${siteUrl}/${defaultLocale}${path}`;

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
      images: [{ url: image, width: 500, height: 500, alt: "Mellon" }],
      locale: locale.replace("-", "_"),
      alternateLocale: enabledLocales
        .filter((alt) => alt.code !== locale)
        .map((alt) => alt.code.replace("-", "_")),
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [image],
    },
  };
}

/**
 * Organization + ProfessionalService structured data (home page of each
 * locale). Facts live in content/organization.json (shared) and the org block
 * of content/<locale>/site.json (localised description/slogan, social links).
 * No street address or coordinates are published on purpose.
 */
export function organizationJsonLd(siteUrl: string, locale: string) {
  const { org } = getSiteContent(locale);
  const brandName = org.legalName.replace(/\s+Pvt Ltd$/i, "");
  const home = `${siteUrl}/${locale}`;
  const orgId = `${siteUrl}/#organization`;
  const logo = `${siteUrl}/brand/logo_color_light_transparentbg.png`;
  const image = `${siteUrl}${DEFAULT_OG_IMAGE}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": orgId,
        name: brandName,
        alternateName: organization.alternateName,
        legalName: org.legalName,
        url: siteUrl,
        logo: { "@type": "ImageObject", "@id": `${siteUrl}/#logo`, url: logo, contentUrl: logo },
        image,
        description: org.description,
        email: org.email,
        telephone: organization.telephone,
        foundingDate: organization.foundingDate,
        sameAs: [...Object.values(org.social), ...organization.moreProfiles],
        knowsAbout: organization.knowsAbout,
        areaServed: organization.areaServed.map((area) => ({ "@type": area.type, name: area.name })),
        contactPoint: organization.contactPoints.map((point) => ({
          "@type": "ContactPoint",
          ...point,
          email: org.email,
        })),
        numberOfEmployees: {
          "@type": "QuantitativeValue",
          minValue: organization.employees.min,
          maxValue: organization.employees.max,
        },
        slogan: org.slogan,
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Design Services",
          itemListElement: getServices(locale).map((service) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: service.name, description: service.tagline },
          })),
        },
      },
      {
        "@type": "ProfessionalService",
        "@id": `${siteUrl}/#localbusiness`,
        name: brandName,
        url: home,
        image,
        description: org.description,
        telephone: organization.telephone,
        priceRange: organization.priceRange,
        address: { "@type": "PostalAddress", ...organization.address },
        areaServed: { "@type": "Place", name: "Worldwide" },
        openingHoursSpecification: [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: organization.openingHours.days,
            opens: organization.openingHours.opens,
            closes: organization.openingHours.closes,
          },
        ],
        parentOrganization: { "@id": orgId },
        mainEntityOfPage: { "@id": home },
      },
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
