import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { enabledLocaleCodes } from "@/lib/locale";
import { getLandingPageBySlug, getPublishedLandingPages, type LandingRow } from "@/lib/landing-db";
import { buildMetadata } from "@/lib/seo";
import { ServiceLanding } from "@/components/landing/ServiceLanding";

/**
 * Landing pages created in /admin/landing-editor. They render with the same
 * ServiceLanding layout as the code-defined pages beside this folder; only the
 * copy comes from Supabase. A folder with a real slug (a code-defined page)
 * always wins over this dynamic segment, so those pages are untouched.
 *
 * Like projects/[slug], dynamicParams stays on so a page published a minute ago
 * resolves without a redeploy, and the admin's revalidateTag("landing") keeps
 * prerendered pages current. A Supabase blip during a build must not fail the
 * deploy, hence the catch.
 */
export async function generateStaticParams() {
  try {
    const pages = await getPublishedLandingPages();
    return pages.flatMap((page) =>
      page.locales.filter((l) => enabledLocaleCodes.includes(l)).map((locale) => ({ locale, slug: page.slug })),
    );
  } catch (error) {
    console.error("[landing] could not list pages for prerender", error);
    return [];
  }
}

export const dynamicParams = true;
export const revalidate = 300;

type PageParams = { locale: string; slug: string };

/** Only published pages, only in the locales they list; anything else 404s. */
async function findPublished(locale: string, slug: string): Promise<LandingRow | undefined> {
  const page = await getLandingPageBySlug(slug);
  return page && page.status === "published" && page.locales.includes(locale) ? page : undefined;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = await findPublished(locale, slug);
  if (!page) return {};
  return buildMetadata({
    locale,
    path: `/${slug}`,
    title: page.copy.metaTitle,
    description: page.copy.metaDescription,
    locales: page.locales,
    noindex: !page.indexable,
  });
}

export default async function AdminLandingPage({ params }: { params: Promise<PageParams> }) {
  const { locale, slug } = await params;
  const page = await findPublished(locale, slug);
  if (!page) notFound();
  return <ServiceLanding text={page.copy} locale={locale} slug={slug} service={page.service ?? undefined} />;
}
