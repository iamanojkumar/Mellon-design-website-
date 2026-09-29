import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getLandingPage,
  getLandingPageLocales,
  landingPageParams,
  resolveLandingCopy,
} from "@/lib/landing-pages";
import { buildMetadata } from "@/lib/seo";
import { getSiteUrl } from "@/lib/env";
import { Container } from "@/components/ui/Container";
import { ContactForm } from "@/components/contact-form/ContactForm";
import { getSiteContent } from "@/lib/content";
import { JsonLd } from "@/components/seo/JsonLd";
import { copy } from "./copy";
import styles from "./page.module.css";

const SLUG = "figma-design-system-agency-india";

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
  const form = getSiteContent(locale).forms.contact;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: text.faq.items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  const siteUrl = getSiteUrl();
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Figma design system design and development",
    serviceType: "Design system agency",
    description: text.metaDescription,
    url: `${siteUrl}/${locale}/${SLUG}`,
    provider: { "@id": `${siteUrl}/#organization` },
    areaServed: { "@type": "Country", name: "United States" },
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
