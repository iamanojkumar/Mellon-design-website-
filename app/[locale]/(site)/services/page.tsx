import type { Metadata } from "next";
import { getPage } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { meta } = getPage(locale, "services");
  return buildMetadata({
    locale,
    path: "/services",
    title: meta.title,
    description: meta.description,
  });
}

export default async function ServicesIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const page = getPage(locale, "services");

  return <BlockRenderer blocks={page.blocks} locale={locale} />;
}
