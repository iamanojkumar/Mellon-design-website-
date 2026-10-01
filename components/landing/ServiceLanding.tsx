import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Cta } from "@/components/cta/Cta";
import { ContactForm } from "@/components/contact-form/ContactForm";
import { JsonLd } from "@/components/seo/JsonLd";
import { RevealGroup } from "@/components/motion/RevealGroup";
import { FadeIn } from "@/components/motion/HeroSequence";
import { SwiftUpText } from "@/components/motion/SwiftUpText";
import { getSiteContent } from "@/lib/content";
import { getSiteUrl } from "@/lib/env";
import styles from "./ServiceLanding.module.css";

/**
 * Copy for a service landing page (hero, approach marquee, deliverables, team
 * fit, case studies, FAQ, quote form). Pages supply this per locale; the layout
 * and colors live here so every service landing page stays in step.
 */
export type ServiceLandingCopy = {
  metaTitle: string;
  metaDescription: string;
  /** schema.org Service name and type for this page's structured data. */
  serviceName: string;
  serviceType: string;
  /** Country the page targets, for the Service's `areaServed`. */
  areaServed: string;
  headline: string;
  summary: string;
  approach: {
    heading: string;
    intro: string;
    steps: { title: string; text: string }[];
  };
  included: {
    heading: string;
    intro: string;
    items: { title: string; text: string }[];
  };
  partner: {
    heading: string;
    items: { title: string; text: string }[];
  };
  /** Omit (or leave `items` empty) until there is real work to show; the section then doesn't render. */
  caseStudies?: {
    heading: string;
    cta: string;
    items: { name: string }[];
  };
  /**
   * Optional link to the matching service page (the hub). Gives readers a way
   * to learn more and tells search engines which service this page belongs to.
   * `href` is a path without the locale, e.g. "/services/saas-design".
   */
  related?: {
    text: string;
    label: string;
    href: string;
  };
  faq: {
    heading: string;
    items: { question: string; answer: string }[];
  };
  quote: {
    heading: string;
    text: string;
  };
};

export function ServiceLanding({
  text,
  locale,
  slug,
}: {
  text: ServiceLandingCopy;
  locale: string;
  slug: string;
}) {
  const site = getSiteContent(locale);
  const form = site.forms.contact;
  const ctaLabel = site.nav.cta.label;
  const caseStudies = text.caseStudies;
  const caseItems = caseStudies?.items ?? [];
  const siteUrl = getSiteUrl();

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: text.faq.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: text.serviceName,
    serviceType: text.serviceType,
    description: text.metaDescription,
    url: `${siteUrl}/${locale}/${slug}`,
    provider: { "@id": `${siteUrl}/#organization` },
    areaServed: { "@type": "Country", name: text.areaServed },
  };

  return (
    <>
      <JsonLd data={faqJsonLd} />
      <JsonLd data={serviceJsonLd} />

      <section className={styles.hero}>
        <Container>
          <h1 className={styles.headline}>
            <SwiftUpText text={text.headline} whenVisible />
          </h1>
          <p className={styles.summary}>
            <SwiftUpText text={text.summary} whenVisible lineDelay={0.12} delay={0.2} />
          </p>
          <FadeIn as="span" whenVisible delay={0.5}>
            <Cta label={ctaLabel} href="#quote" variant="primary" context="landing" />
          </FadeIn>
        </Container>
      </section>

      <section className={`${styles.section} ${styles.mintBand}`}>
        <Container>
          <h2 className={styles.heading}>
            <SwiftUpText text={text.approach.heading} whenVisible />
          </h2>
          <p className={styles.intro}>
            <SwiftUpText text={text.approach.intro} whenVisible lineDelay={0.12} delay={0.2} />
          </p>
        </Container>
        {/* Marquee: the list is rendered twice and the track slides by exactly one
            copy, so the loop is seamless. The duplicate is hidden from assistive tech. */}
        <FadeIn whenVisible delay={0.3}>
        <div className={styles.marquee}>
          <div className={styles.track}>
            {[0, 1].map((copyIndex) => (
              <ol
                key={copyIndex}
                className={styles.steps}
                aria-hidden={copyIndex === 1 ? true : undefined}
              >
                {text.approach.steps.map((step) => (
                  <li key={step.title} className={styles.step}>
                    <h3 className={styles.stepTitle}>{step.title}</h3>
                    <p>{step.text}</p>
                  </li>
                ))}
              </ol>
            ))}
          </div>
        </div>
        </FadeIn>
      </section>

      <section className={styles.section}>
        <Container>
          <h2 className={styles.heading}>
            <SwiftUpText text={text.included.heading} whenVisible />
          </h2>
          <p className={styles.intro}>
            <SwiftUpText text={text.included.intro} whenVisible lineDelay={0.12} delay={0.2} />
          </p>
          <RevealGroup as="ul" className={styles.partnerGrid}>
            {text.included.items.map((item) => (
              <li key={item.title} className={styles.partnerCard}>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p>{item.text}</p>
              </li>
            ))}
          </RevealGroup>
          {text.related ? (
            <FadeIn whenVisible>
              <p className={styles.related}>
                {text.related.text}{" "}
                <Link href={`/${locale}${text.related.href}`} className={styles.caseLink}>
                  {text.related.label}
                </Link>
              </p>
            </FadeIn>
          ) : null}
        </Container>
      </section>

      <section className={`${styles.section} ${styles.greyBand}`}>
        <Container>
          <h2 className={styles.heading}>
            <SwiftUpText text={text.partner.heading} whenVisible />
          </h2>
          <RevealGroup as="ul" className={styles.partnerGrid}>
            {text.partner.items.map((item) => (
              <li key={item.title} className={styles.partnerCard}>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p>{item.text}</p>
              </li>
            ))}
          </RevealGroup>
        </Container>
      </section>

      {caseStudies && caseItems.length > 0 ? (
      <section className={`${styles.section} ${styles.lavenderBand}`}>
        <Container>
          <h2 className={styles.heading}>
            <SwiftUpText text={caseStudies.heading} whenVisible />
          </h2>
          <RevealGroup as="ul" className={styles.caseGrid}>
            {caseItems.map((item) => (
              <li key={item.name} className={styles.caseCard}>
                <h3 className={styles.cardTitle}>{item.name}</h3>
                <FadeIn as="span" whenVisible>
                  <a href="#quote" className={styles.caseLink}>
                    {caseStudies.cta}
                  </a>
                </FadeIn>
              </li>
            ))}
          </RevealGroup>
        </Container>
      </section>
      ) : null}

      <section className={styles.section}>
        <Container>
          <h2 className={styles.heading}>
            <SwiftUpText text={text.faq.heading} whenVisible />
          </h2>
          <RevealGroup className={styles.faq}>
            {text.faq.items.map((item, i) => (
              <details key={item.question} className={styles.faqItem} open={i === 0}>
                <summary className={styles.faqQuestion}>{item.question}</summary>
                <p className={styles.faqAnswer}>{item.answer}</p>
              </details>
            ))}
          </RevealGroup>
        </Container>
      </section>

      <section id="quote" className={`${styles.section} ${styles.greenBand}`}>
        <Container className={styles.quoteGrid}>
          <div>
            <h2 className={styles.quoteHeading}>
              <SwiftUpText text={text.quote.heading} whenVisible />
            </h2>
            <p className={styles.quoteText}>
              <SwiftUpText text={text.quote.text} whenVisible lineDelay={0.12} delay={0.2} />
            </p>
          </div>
          <div>
            <ContactForm
              successMessage={form.successMessage}
              submitLabel={form.submitLabel}
              labels={form.labels}
              privacyHref={`/${locale}/privacy`}
              locale={locale}
            />
          </div>
        </Container>
      </section>
    </>
  );
}
