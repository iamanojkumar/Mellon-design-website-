import type { Metadata } from "next";
import { getPage } from "@/lib/content";
import { buildMetadata, organizationJsonLd } from "@/lib/seo";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { getSiteUrl } from "@/lib/env";
import { JsonLd } from "@/components/seo/JsonLd";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { meta } = getPage(locale, "home");
  return buildMetadata({
    locale,
    path: "",
    title: meta.title,
    description: meta.description,
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const page = getPage(locale, "home");

  return (
    <>
      <JsonLd data={organizationJsonLd(getSiteUrl(), locale)} />
      <BlockRenderer blocks={page.blocks} locale={locale} />
    </>
  );
}
