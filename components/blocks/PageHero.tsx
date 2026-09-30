import type { Block } from "@/lib/blocks";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/motion/HeroSequence";
import { SwiftUpText } from "@/components/motion/SwiftUpText";
import styles from "./PageHero.module.css";

export function PageHero({
  block,
  locale,
}: {
  block: Extract<Block, { type: "pageHero" }>;
  locale: string;
}) {
  const updated = block.updated
    ? new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(block.updated.date))
    : null;
  return (
    <section className={styles.hero}>
      <Container>
        <FadeIn as="span" whenVisible className={styles.eyebrow}>
          {block.eyebrow}
        </FadeIn>
        <h1 className={styles.headline}>
          <SwiftUpText text={block.headline} whenVisible />
        </h1>
        {block.updated && (
          <p className={styles.updated}>
            {block.updated.label}: {updated}
          </p>
        )}
        <p className={styles.subhead}>
          <SwiftUpText text={block.subhead} whenVisible lineDelay={0.12} delay={0.2} />
        </p>
      </Container>
    </section>
  );
}
