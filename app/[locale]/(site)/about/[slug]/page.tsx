import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage, getSiteContent } from "@/lib/content";
import { companyPages, getCompanyPage, isVisible } from "@/lib/company-pages";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { getSiteUrl } from "@/lib/env";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { JsonLd } from "@/components/seo/JsonLd";

export function generateStaticParams() {
  return companyPages.flatMap((page) =>
    page.locales.map((locale) => ({ locale, slug: page.slug })),
  );
}

export const dynamicParams = false;

type PageParams = { locale: string; slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const company = getCompanyPage(slug);
  if (!company) return {};
  const { meta } = getPage(locale, company.key);
  return buildMetadata({
    locale,
    path: `/about/${slug}`,
    title: meta.title,
    description: meta.description,
    locales: company.locales,
    noindex: company.draft,
  });
}

export default async function CompanyPageRoute({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { locale, slug } = await params;
  const company = getCompanyPage(slug);
  if (!company || !isVisible(company)) notFound();

  const site = getSiteContent(locale);
  const page = getPage(locale, company.key);
  const localePrefix = `/${locale}`;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(getSiteUrl(), [
          { name: site.common.home, path: localePrefix },
          { name: "About", path: `${localePrefix}/about` },
          { name: company.label, path: `${localePrefix}/about/${slug}` },
        ])}
      />
      <BlockRenderer blocks={page.blocks} locale={locale} />
    </>
  );
}
