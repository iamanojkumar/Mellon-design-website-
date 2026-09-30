import type { Block } from "@/lib/blocks";
import { getSiteContent } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { ContactForm } from "@/components/contact-form/ContactForm";
import { FadeIn } from "@/components/motion/HeroSequence";
import { SwiftUpText } from "@/components/motion/SwiftUpText";
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
          <FadeIn as="span" whenVisible className={styles.eyebrow}>
            {block.eyebrow}
          </FadeIn>
          <h1 className={styles.headline}>
            <SwiftUpText text={block.headline} whenVisible />
          </h1>
          <p className={styles.subhead}>
            <SwiftUpText text={block.subhead} whenVisible lineDelay={0.12} delay={0.2} />
          </p>
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
