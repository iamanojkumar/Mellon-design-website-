import { getSiteContent } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { ContactForm } from "@/components/contact-form/ContactForm";
import { FadeIn } from "@/components/motion/HeroSequence";
import { SwiftUpText } from "@/components/motion/SwiftUpText";
import styles from "./ProjectCta.module.css";

/**
 * Closing enquiry section on every case study: the shared contact form (same
 * validation, storage and notification as the contact page) next to a short
 * pitch. Copy lives in site.projectsPage.cta per locale.
 */
export function ProjectCta({ locale }: { locale: string }) {
  const site = getSiteContent(locale);
  const copy = site.projectsPage.cta;
  const form = site.forms.contact;

  return (
    <section id="start-a-project" className={styles.section}>
      <Container className={styles.grid}>
        <div>
          <FadeIn as="span" whenVisible className={styles.eyebrow}>
            {copy.eyebrow}
          </FadeIn>
          <h2 className={styles.heading}>
            <SwiftUpText text={copy.headline} whenVisible />
          </h2>
          <p className={styles.text}>
            <SwiftUpText text={copy.body} whenVisible lineDelay={0.12} delay={0.2} />
          </p>
          <p className={styles.direct}>
            {copy.directEmailLabel} <a href={`mailto:${site.org.email}`}>{site.org.email}</a>
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
  );
}
