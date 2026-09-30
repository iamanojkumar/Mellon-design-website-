import type { Block } from "@/lib/blocks";
import { Container } from "@/components/ui/Container";
import { Cta } from "@/components/cta/Cta";
import { HeroSequence, FadeIn } from "@/components/motion/HeroSequence";
import { SwiftUpText } from "@/components/motion/SwiftUpText";
import styles from "./HomeBlocks.module.css";

export function Hero({
  block,
  locale,
}: {
  block: Extract<Block, { type: "hero" }>;
  locale: string;
}) {
  const prefix = `/${locale}`;
  return (
    <section className={styles.hero}>
      <Container className={styles.heroInner}>
        <HeroSequence>
          <h1 className={styles.heroHeadline}>
            <SwiftUpText text={block.headline} step={0} advanceOn="start" />
          </h1>
          <p className={styles.heroSubhead}>
            <SwiftUpText text={block.subhead} step={0} lineDelay={0.12} />
          </p>
          <FadeIn step={1} className={styles.heroCtas}>
            <Cta label={block.primaryCta.label} href={`${prefix}${block.primaryCta.href}`} variant="primary" context="home" />
            <Cta label={block.secondaryCta.label} href={`${prefix}${block.secondaryCta.href}`} variant="secondary" context="home" />
          </FadeIn>
        </HeroSequence>
      </Container>
    </section>
  );
}
