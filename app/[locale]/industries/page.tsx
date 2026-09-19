import type { Metadata } from "next";
import Link from "next/link";
import { getIndustries, getSiteContent } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { Container } from "@/components/ui/Container";
import { Cta } from "@/components/cta/Cta";
import styles from "./page.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const site = getSiteContent(locale);
  return buildMetadata({
    locale,
    path: "/industries",
    title: `Industries — ${site.org.name}`,
    description:
      "Sixteen industries Mellon has designed for, from architecture and automotive to fintech and restaurants — with patterns specific to each.",
  });
}

export default async function IndustriesIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const industries = getIndustries(locale);
  const localePrefix = `/${locale}`;

  return (
    <>
      <section className={styles.hero}>
        <Container>
          <span className={styles.eyebrow}>Industries</span>
          <h1 className={styles.headline}>
            Deep enough in each industry to skip the learning curve.
          </h1>
          <p className={styles.subhead}>
            Sixteen verticals, each with its own constraints. Pick yours to see
            the patterns and services we lean on there.
          </p>
        </Container>
      </section>

      <section className={styles.list}>
        <Container>
          <div className={styles.grid}>
            {industries.map((industry) => (
              <Link
                key={industry.slug}
                href={`${localePrefix}/industries/${industry.slug}`}
                className={styles.card}
              >
                <h2 className={styles.cardTitle}>{industry.name}</h2>
                <p className={styles.cardTagline}>{industry.tagline}</p>
                <span className={styles.cardLink}>View industry →</span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className={styles.closing}>
        <Container className={styles.closingInner}>
          <h2 className={styles.closingHeadline}>Don&apos;t see your industry?</h2>
          <p className={styles.closingBody}>
            The disciplines transfer even when the vertical is new to us. Tell us
            what you&apos;re building.
          </p>
          <Cta label="Start a project" href={`${localePrefix}/contact`} context="industry" />
        </Container>
      </section>
    </>
  );
}
