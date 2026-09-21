import type { Block } from "@/lib/blocks";
import { Container } from "@/components/ui/Container";
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
        <span className={styles.eyebrow}>{block.eyebrow}</span>
        <h1 className={styles.headline}>{block.headline}</h1>
        {block.updated && (
          <p className={styles.updated}>
            {block.updated.label}: {updated}
          </p>
        )}
        <p className={styles.subhead}>{block.subhead}</p>
      </Container>
    </section>
  );
}
