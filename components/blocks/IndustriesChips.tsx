import Link from "next/link";
import type { Block } from "@/lib/blocks";
import { getIndustries } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import styles from "./HomeBlocks.module.css";

export function IndustriesChips({
  block,
  locale,
}: {
  block: Extract<Block, { type: "industriesChips" }>;
  locale: string;
}) {
  return (
    <section className={`${styles.section} ${styles.sectionInverted}`}>
      <Container>
        <div className={styles.sectionHead}>
          <span className={styles.eyebrow}>{block.eyebrow}</span>
          <h2 className={styles.sectionHeadlineLight}>{block.headline}</h2>
          <p className={styles.sectionBodyLight}>{block.body}</p>
        </div>
        <div className={styles.industryList}>
          {getIndustries(locale).map((industry) => (
            <Link key={industry.slug} href={`/${locale}/industries/${industry.slug}`} className={styles.industryChip}>
              {industry.name}
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
