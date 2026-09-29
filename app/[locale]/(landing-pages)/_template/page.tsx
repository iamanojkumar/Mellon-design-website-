import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getLandingPage,
  getLandingPageLocales,
  landingPageParams,
  resolveLandingCopy,
} from "@/lib/landing-pages";
import { buildMetadata } from "@/lib/seo";
import { Container } from "@/components/ui/Container";
import { Cta } from "@/components/cta/Cta";
import { copy } from "./copy";
import styles from "./page.module.css";

// Copy this folder to `../<slug>/`, set SLUG to the same value, and register it
// in lib/landing-pages.ts. Locales not registered there 404.
const SLUG = "replace-me";

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
  const text = resolveLandingCopy(copy, locale);

  return (
    <section id="quote" className={styles.hero}>
      <Container>
        <span className={styles.eyebrow}>{text.eyebrow}</span>
        <h1 className={styles.headline}>{text.headline}</h1>
        <p className={styles.summary}>{text.summary}</p>
        <Cta label={text.cta} href={`/${locale}/contact`} context="landing" />
      </Container>
    </section>
  );
}
