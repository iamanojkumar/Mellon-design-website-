import type { Block } from "@/lib/blocks";
import { getSiteContent } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { ContactForm } from "@/components/contact-form/ContactForm";
import { Cta } from "@/components/cta/Cta";
import { FadeIn } from "@/components/motion/HeroSequence";
import { SwiftUpText } from "@/components/motion/SwiftUpText";
import styles from "./HomeBlocks.module.css";

export function ClosingCta({
  block,
  locale,
}: {
  block: Extract<Block, { type: "closingCta" }>;
  locale: string;
}) {
  const form = block.withForm ? getSiteContent(locale).forms.contact : null;
  return (
    <section className={styles.closing}>
      <Container className={form ? `${styles.closingInner} ${styles.closingSplit}` : styles.closingInner}>
        <div>
          <h2 className={styles.closingHeadline}>
            <SwiftUpText text={block.headline} whenVisible />
          </h2>
          {block.body && (
            <p className={styles.closingBody}>
              <SwiftUpText text={block.body} whenVisible lineDelay={0.12} delay={0.2} />
            </p>
          )}
          {!form && (
            <FadeIn as="span" whenVisible delay={0.5} className={styles.closingCtaWrap}>
              <Cta label={block.cta.label} href={`/${locale}${block.cta.href}`} variant="primary" context="home" />
            </FadeIn>
          )}
        </div>
        {form && (
          <div className={styles.closingForm}>
            <ContactForm
              successMessage={form.successMessage}
              submitLabel={form.submitLabel}
              labels={form.labels}
              privacyHref={`/${locale}/privacy`}
              locale={locale}
            />
          </div>
        )}
      </Container>
    </section>
  );
}
