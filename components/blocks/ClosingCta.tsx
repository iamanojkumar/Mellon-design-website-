import type { Block } from "@/lib/blocks";
import { Container } from "@/components/ui/Container";
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
  return (
    <section className={styles.closing}>
      <Container className={styles.closingInner}>
        <h2 className={styles.closingHeadline}>
          <SwiftUpText text={block.headline} whenVisible />
        </h2>
        {block.body && (
          <p className={styles.closingBody}>
            <SwiftUpText text={block.body} whenVisible lineDelay={0.12} delay={0.2} />
          </p>
        )}
        <FadeIn as="span" whenVisible delay={0.5} className={styles.closingCtaWrap}>
          <Cta label={block.cta.label} href={`/${locale}${block.cta.href}`} variant="primary" context="home" />
        </FadeIn>
      </Container>
    </section>
  );
}
