import type { Block } from "@/lib/blocks";
import { Container } from "@/components/ui/Container";
import { Cta } from "@/components/cta/Cta";
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
        <h2 className={styles.closingHeadline}>{block.headline}</h2>
        {block.body && <p className={styles.closingBody}>{block.body}</p>}
        <Cta label={block.cta.label} href={`/${locale}${block.cta.href}`} variant="primary" context="home" />
      </Container>
    </section>
  );
}
