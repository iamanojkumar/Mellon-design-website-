import type { Block } from "@/lib/blocks";
import { Container } from "@/components/ui/Container";
import { Cta } from "@/components/cta/Cta";
import { HeroImageStack } from "./HeroImageStack";
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
      <Container>
        <h1 className={styles.heroHeadline}>{block.headline}</h1>
        <div className={styles.heroRow}>
          <div className={styles.heroCopy}>
            <p className={styles.heroSubhead}>{block.subhead}</p>
            <div className={styles.heroCtas}>
              <Cta label={block.primaryCta.label} href={`${prefix}${block.primaryCta.href}`} variant="primary" context="home" />
              <Cta label={block.secondaryCta.label} href={`${prefix}${block.secondaryCta.href}`} variant="secondary" context="home" />
            </div>
          </div>
          <div className={styles.heroVisual}>
            <HeroImageStack images={block.images} />
          </div>
        </div>
      </Container>
    </section>
  );
}
