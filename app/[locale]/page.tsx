import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getIndustries, getServices, getSiteContent } from "@/lib/content";
import { buildMetadata, organizationJsonLd } from "@/lib/seo";
import { getSiteUrl } from "@/lib/env";
import { Container } from "@/components/ui/Container";
import { Cta } from "@/components/cta/Cta";
import { JsonLd } from "@/components/seo/JsonLd";
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
    path: "",
    title: `${site.org.name} — Design agency for brand, product, and digital experience`,
    description: site.org.shortDescription,
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const site = getSiteContent(locale);
  const services = getServices(locale);
  const industries = getIndustries(locale);
  const localePrefix = `/${locale}`;

  return (
    <>
      <JsonLd data={organizationJsonLd(getSiteUrl())} />

      <section className={styles.hero}>
        <div className={styles.heroImageWrap}>
          <Image
            src="/images/Mellon-hero-banner.webp"
            alt=""
            fill
            priority
            className={styles.heroImage}
          />
          <div className={styles.heroOverlay} />
        </div>
        <Container className={styles.heroContent}>
          <span className={styles.eyebrow}>{site.home.hero.eyebrow}</span>
          <h1 className={styles.heroHeadline}>{site.home.hero.headline}</h1>
          <p className={styles.heroSubhead}>{site.home.hero.subhead}</p>
          <div className={styles.heroCtas}>
            <Cta
              label={site.home.hero.primaryCta.label}
              href={`${localePrefix}${site.home.hero.primaryCta.href}`}
              variant="primary"
              context="home"
            />
            <Cta
              label={site.home.hero.secondaryCta.label}
              href={`${localePrefix}${site.home.hero.secondaryCta.href}`}
              variant="secondary"
              context="home"
              className={styles.heroSecondary}
            />
          </div>
        </Container>
      </section>

      <section className={styles.section}>
        <Container>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrowDark}>{site.home.servicesIntro.eyebrow}</span>
            <h2 className={styles.sectionHeadline}>{site.home.servicesIntro.headline}</h2>
            <p className={styles.sectionBody}>{site.home.servicesIntro.body}</p>
          </div>

          <div className={styles.grid}>
            {services.map((service) => (
              <Link
                key={service.slug}
                href={`${localePrefix}/services/${service.slug}`}
                className={styles.card}
              >
                <h3 className={styles.cardTitle}>{service.name}</h3>
                <p className={styles.cardBody}>{service.tagline}</p>
                <span className={styles.cardLink}>Learn more →</span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className={`${styles.section} ${styles.sectionInverted}`}>
        <Container>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>{site.home.industriesIntro.eyebrow}</span>
            <h2 className={styles.sectionHeadlineLight}>{site.home.industriesIntro.headline}</h2>
            <p className={styles.sectionBodyLight}>{site.home.industriesIntro.body}</p>
          </div>

          <div className={styles.industryList}>
            {industries.map((industry) => (
              <Link
                key={industry.slug}
                href={`${localePrefix}/industries/${industry.slug}`}
                className={styles.industryChip}
              >
                {industry.name}
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className={styles.section}>
        <Container>
          <div className={styles.processGrid}>
            <div>
              <span className={styles.eyebrowDark}>{site.home.process.eyebrow}</span>
              <h2 className={styles.sectionHeadline}>{site.home.process.headline}</h2>
              <p className={styles.sectionBody}>{site.home.process.body}</p>
            </div>
            <ol className={styles.steps}>
              {site.home.process.steps.map((step, index) => (
                <li key={step.title} className={styles.step}>
                  <span className={styles.stepNumber}>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className={styles.stepTitle}>{step.title}</h3>
                    <p className={styles.stepBody}>{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      <section className={styles.closing}>
        <Container className={styles.closingInner}>
          <h2 className={styles.closingHeadline}>{site.home.closingCta.headline}</h2>
          <p className={styles.closingBody}>{site.home.closingCta.body}</p>
          <Cta
            label={site.home.closingCta.cta.label}
            href={`${localePrefix}${site.home.closingCta.cta.href}`}
            variant="primary"
            context="home"
          />
        </Container>
      </section>
    </>
  );
}
