import type { Metadata } from "next";
import Link from "next/link";
import { getServices, getSiteContent } from "@/lib/content";
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
    path: "/services",
    title: `Services — ${site.org.name}`,
    description:
      "Branding, design systems, product design, and nine other disciplines Mellon uses to take a brand from idea to shipped interface.",
  });
}

export default async function ServicesIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const services = getServices(locale);
  const localePrefix = `/${locale}`;

  return (
    <>
      <section className={styles.hero}>
        <Container>
          <span className={styles.eyebrow}>Services</span>
          <h1 className={styles.headline}>Ten disciplines, one studio, no hand-offs.</h1>
          <p className={styles.subhead}>
            Every service below can run alone or as part of a single end-to-end
            engagement — the same team either way.
          </p>
        </Container>
      </section>

      <section className={styles.list}>
        <Container>
          <div className={styles.grid}>
            {services.map((service) => (
              <Link
                key={service.slug}
                href={`${localePrefix}/services/${service.slug}`}
                className={styles.card}
              >
                <h2 className={styles.cardTitle}>{service.name}</h2>
                <p className={styles.cardTagline}>{service.tagline}</p>
                <span className={styles.cardLink}>View service →</span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className={styles.closing}>
        <Container className={styles.closingInner}>
          <h2 className={styles.closingHeadline}>Not sure which service fits?</h2>
          <p className={styles.closingBody}>
            Tell us what you&apos;re building and we&apos;ll scope the right mix.
          </p>
          <Cta label="Start a project" href={`${localePrefix}/contact`} context="service" />
        </Container>
      </section>
    </>
  );
}
