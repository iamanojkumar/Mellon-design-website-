import Image from "next/image";
import type { Block } from "@/lib/blocks";
import { Container } from "@/components/ui/Container";
import { Cta } from "@/components/cta/Cta";
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
      <div className={styles.heroImageWrap}>
        <Image
          src={block.image.src}
          alt={block.image.alt}
          width={block.image.width}
          height={block.image.height}
          priority
          sizes="100vw"
          className={styles.heroImage}
        />
      </div>
      <Container className={styles.heroContent}>
        <span className={styles.eyebrowDark}>{block.eyebrow}</span>
        <h1 className={styles.heroHeadline}>{block.headline}</h1>
        <p className={styles.heroSubhead}>{block.subhead}</p>
        <div className={styles.heroCtas}>
          <Cta label={block.primaryCta.label} href={`${prefix}${block.primaryCta.href}`} variant="primary" context="home" />
          <Cta label={block.secondaryCta.label} href={`${prefix}${block.secondaryCta.href}`} variant="secondary" context="home" />
        </div>
      </Container>
    </section>
  );
}
