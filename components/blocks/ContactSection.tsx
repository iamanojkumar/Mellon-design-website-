import type { Block } from "@/lib/blocks";
import { getSiteContent } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { ContactForm } from "@/components/contact-form/ContactForm";
import styles from "./ContactSection.module.css";

export function ContactSection({
  block,
  locale,
}: {
  block: Extract<Block, { type: "contact" }>;
  locale: string;
}) {
  const site = getSiteContent(locale);
  const form = site.forms.contact;
  return (
    <section className={styles.section}>
      <Container className={styles.grid}>
        <div className={styles.intro}>
          <span className={styles.eyebrow}>{block.eyebrow}</span>
          <h1 className={styles.headline}>{block.headline}</h1>
          <p className={styles.subhead}>{block.subhead}</p>
          <p className={styles.direct}>
            {block.directEmailLabel}{" "}
            <a href={`mailto:${site.org.email}`}>{site.org.email}</a>
          </p>
        </div>
        <div className={styles.formWrap}>
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
