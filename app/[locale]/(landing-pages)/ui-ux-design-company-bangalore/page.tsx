import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getLandingPage,
  getLandingPageLocales,
  landingPageParams,
  resolveLandingCopy,
} from "@/lib/landing-pages";
import { buildMetadata } from "@/lib/seo";
import { ServiceLanding } from "@/components/landing/ServiceLanding";
import { copy } from "./copy";

const SLUG = "ui-ux-design-company-bangalore";

export function generateStaticParams() {
  return landingPageParams(SLUG);
}

export const dynamicParams = false;

type PageParams = { locale: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { locale } = await params;
  const page = getLandingPage(SLUG);
  if (!page) return {};
  const text = resolveLandingCopy(copy, locale);
  return buildMetadata({
    locale,
    path: `/${SLUG}`,
    title: text.metaTitle,
    description: text.metaDescription,
    locales: getLandingPageLocales(page),
    noindex: !page.indexable,
  });
}

export default async function LandingPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { locale } = await params;
  if (!getLandingPage(SLUG)) notFound();
  return <ServiceLanding text={resolveLandingCopy(copy, locale)} locale={locale} slug={SLUG} />;
}
