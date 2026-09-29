import type { Metadata } from "next";
import { getPage } from "@/lib/content";
import { buildMetadata, organizationJsonLd } from "@/lib/seo";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { getSiteUrl } from "@/lib/env";
import { JsonLd } from "@/components/seo/JsonLd";

/**
 * The home page carries a projectsPreview block, so it reads Supabase like the
 * projects routes do and needs the same safety net against a build-cached
 * result — see app/[locale]/projects/page.tsx for the full reasoning. Tag
 * revalidation on publish remains the primary mechanism.
 */
export const revalidate = 300;

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
