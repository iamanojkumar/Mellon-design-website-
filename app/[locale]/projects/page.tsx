import type { Metadata } from "next";
import { getPage } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { BlockRenderer } from "@/components/blocks/BlockRenderer";
import { enabledLocaleCodes } from "@/lib/locale";

export function generateStaticParams() {
  return enabledLocaleCodes.map((locale) => ({ locale }));
}

export const dynamicParams = false;

/**
 * Publishing in the admin calls revalidateTag("projects:<locale>"), which
 * refreshes this page within seconds — that is the mechanism this page relies
 * on. The time-based window is a safety net for one specific gap: the tagged
 * fetch lands in Next's Data Cache, Vercel restores that cache between builds,
 * and a fresh deployment can therefore prerender from a result captured before
 * a publish, with no tag purge left to correct it. Reproduced locally: a warm
 * build served the empty state while the row existed; a clean build did not.
 */
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { meta } = getPage(locale, "projects");
  return buildMetadata({
    locale,
    path: "/projects",
    title: meta.title,
    description: meta.description,
  });
}

export default async function ProjectsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const page = getPage(locale, "projects");

  return <BlockRenderer blocks={page.blocks} locale={locale} />;
}
