import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getIndustries,
  getService,
  getServices,
  getSiteContent,
} from "@/lib/content";
import { enabledLocaleCodes } from "@/lib/locale";
import { breadcrumbJsonLd, buildMetadata, serviceJsonLd } from "@/lib/seo";
import { getSiteUrl } from "@/lib/env";
import { Container } from "@/components/ui/Container";
import { Cta } from "@/components/cta/Cta";
import { JsonLd } from "@/components/seo/JsonLd";
import { FadeIn } from "@/components/motion/HeroSequence";
import { RevealGroup } from "@/components/motion/RevealGroup";
import { SwiftUpText } from "@/components/motion/SwiftUpText";
import styles from "./page.module.css";

export function generateStaticParams() {
  return enabledLocaleCodes.flatMap((locale) =>
    getServices(locale).map((service) => ({ locale, slug: service.slug })),
  );
}

export const dynamicParams = false;

type PageParams = { locale: string; slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const service = getService(locale, slug);
  if (!service) return {};
  const site = getSiteContent(locale);
  return buildMetadata({
    locale,
    path: `/services/${slug}`,
    title: service.metaTitle ?? `${service.name} — ${site.org.name}`,
    description: service.metaDescription ?? service.summary,
  });
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { locale, slug } = await params;
  const service = getService(locale, slug);
  if (!service) notFound();

  const site = getSiteContent(locale);
  const page = site.servicesPage;
  const industries = getIndustries(locale);
  const relatedIndustries = industries.filter((industry) =>
    service.relatedIndustries.includes(industry.slug),
  );
  const relatedServices = getServices(locale).filter((other) =>
    service.relatedServices?.includes(other.slug),
  );
  const localePrefix = `/${locale}`;
  const siteUrl = getSiteUrl();
  const path = `/services/${slug}`;
  const closing = page.detail.readyHeadline
    .replace("{nameLower}", service.name.toLocaleLowerCase(locale))
    .replace("{name}", service.name);

  return (
    <>
      <JsonLd data={serviceJsonLd(siteUrl, service, `${localePrefix}${path}`)} />
      <JsonLd
        data={breadcrumbJsonLd(siteUrl, [
          { name: site.common.home, path: localePrefix },
          { name: page.label, path: `${localePrefix}/services` },
          { name: service.name, path: `${localePrefix}${path}` },
        ])}
      />
      {service.faqs && service.faqs.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: service.faqs.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
          }}
        />
      )}

      <section className={styles.hero}>
        <Container>
          <nav className={styles.breadcrumb} aria-label={site.common.breadcrumbAria}>
            <Link href={`${localePrefix}/services`}>{page.label}</Link>
            <span aria-hidden="true">/</span>
            <span>{service.name}</span>
          </nav>
          <FadeIn as="span" whenVisible className={styles.eyebrow}>
            {service.tagline}
          </FadeIn>
          <h1 className={styles.headline}>
            <SwiftUpText text={service.headline ?? service.name} whenVisible />
          </h1>
          <p className={styles.summary}>
            <SwiftUpText text={service.summary} whenVisible lineDelay={0.12} delay={0.2} />
          </p>
          <FadeIn whenVisible delay={0.4}>
            <Cta label={site.common.startProject} href={`${localePrefix}/contact`} context="service" />
          </FadeIn>
        </Container>
      </section>

      <section className={styles.body}>
        <Container className={styles.bodyGrid}>
          <div>
            <h2 className={styles.blockHeading}>
              <SwiftUpText text={page.detail.included} whenVisible />
            </h2>
            <RevealGroup as="ul" className={styles.deliverables}>
              {service.deliverables.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </RevealGroup>
          </div>

          {relatedIndustries.length > 0 && (
            <div>
              <h2 className={styles.blockHeading}>
                <SwiftUpText text={page.detail.usedIn} whenVisible />
              </h2>
              <RevealGroup as="ul" className={styles.relatedList}>
                {relatedIndustries.map((industry) => (
                  <li key={industry.slug}>
                    <Link href={`${localePrefix}/industries/${industry.slug}`}>
                      {industry.name}
                    </Link>
                  </li>
                ))}
              </RevealGroup>
            </div>
          )}
        </Container>
      </section>

      {service.process && service.process.length > 0 && (
        <section className={`${styles.body} ${styles.tinted}`}>
          <Container>
            <h2 className={styles.blockHeading}>
              <SwiftUpText text={page.detail.processHeading} whenVisible />
            </h2>
            <RevealGroup as="ol" className={styles.steps}>
              {service.process.map((step) => (
                <li key={step.title} className={styles.step}>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p>{step.text}</p>
                </li>
              ))}
            </RevealGroup>
          </Container>
        </section>
      )}

      {service.faqs && service.faqs.length > 0 && (
        <section className={styles.body}>
          <Container>
            <h2 className={styles.blockHeading}>
              <SwiftUpText text={page.detail.faqHeading} whenVisible />
            </h2>
            <RevealGroup className={styles.faq}>
              {service.faqs.map((item, i) => (
                <details key={item.question} className={styles.faqItem} open={i === 0}>
                  <summary className={styles.faqQuestion}>{item.question}</summary>
                  <p className={styles.faqAnswer}>{item.answer}</p>
                </details>
              ))}
            </RevealGroup>
          </Container>
        </section>
      )}

      {relatedServices.length > 0 && (
        <section className={styles.bodyCompact}>
          <Container>
            <h2 className={styles.blockHeading}>
              <SwiftUpText text={page.detail.relatedServices} whenVisible />
            </h2>
            <RevealGroup as="ul" className={styles.relatedList}>
              {relatedServices.map((other) => (
                <li key={other.slug}>
                  <Link href={`${localePrefix}/services/${other.slug}`}>{other.name}</Link>
                </li>
              ))}
            </RevealGroup>
          </Container>
        </section>
      )}

      <section className={styles.closing}>
        <Container className={styles.closingInner}>
          <h2 className={styles.closingHeadline}>
            <SwiftUpText text={closing} whenVisible />
          </h2>
          <FadeIn whenVisible delay={0.2}>
            <Cta label={site.common.startProject} href={`${localePrefix}/contact`} context="service" />
          </FadeIn>
        </Container>
      </section>
    </>
  );
}
