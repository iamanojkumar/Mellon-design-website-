import { Container } from "@/components/ui/Container";
import { ContactForm } from "@/components/contact-form/ContactForm";
import { JsonLd } from "@/components/seo/JsonLd";
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
  caseStudies: {
    heading: string;
    cta: string;
    items: { name: string }[];
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
  const form = getSiteContent(locale).forms.contact;
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
          <h1 className={styles.headline}>{text.headline}</h1>
          <p className={styles.summary}>{text.summary}</p>
        </Container>
      </section>

      <section className={`${styles.section} ${styles.mintBand}`}>
        <Container>
          <h2 className={styles.heading}>{text.approach.heading}</h2>
          <p className={styles.intro}>{text.approach.intro}</p>
        </Container>
        {/* Marquee: the list is rendered twice and the track slides by exactly one
            copy, so the loop is seamless. The duplicate is hidden from assistive tech. */}
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
      </section>

      <section className={styles.section}>
        <Container>
          <h2 className={styles.heading}>{text.included.heading}</h2>
          <p className={styles.intro}>{text.included.intro}</p>
          <ul className={styles.partnerGrid}>
            {text.included.items.map((item) => (
              <li key={item.title} className={styles.partnerCard}>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p>{item.text}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className={`${styles.section} ${styles.greyBand}`}>
        <Container>
          <h2 className={styles.heading}>{text.partner.heading}</h2>
          <ul className={styles.partnerGrid}>
            {text.partner.items.map((item) => (
              <li key={item.title} className={styles.partnerCard}>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p>{item.text}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className={`${styles.section} ${styles.lavenderBand}`}>
        <Container>
          <h2 className={styles.heading}>{text.caseStudies.heading}</h2>
          <ul className={styles.caseGrid}>
            {text.caseStudies.items.map((item) => (
              <li key={item.name} className={styles.caseCard}>
                <h3 className={styles.cardTitle}>{item.name}</h3>
                <a href="#quote" className={styles.caseLink}>
                  {text.caseStudies.cta}
                </a>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className={styles.section}>
        <Container>
          <h2 className={styles.heading}>{text.faq.heading}</h2>
          <div className={styles.faq}>
            {text.faq.items.map((item, i) => (
              <details key={item.question} className={styles.faqItem} open={i === 0}>
                <summary className={styles.faqQuestion}>{item.question}</summary>
                <p className={styles.faqAnswer}>{item.answer}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      <section id="quote" className={`${styles.section} ${styles.greenBand}`}>
        <Container className={styles.quoteGrid}>
          <div>
            <h2 className={styles.quoteHeading}>{text.quote.heading}</h2>
            <p className={styles.quoteText}>{text.quote.text}</p>
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
