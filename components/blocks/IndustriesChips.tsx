import Link from "next/link";
import type { Block } from "@/lib/blocks";
import { getIndustries } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/motion/HeroSequence";
import { SwiftUpText } from "@/components/motion/SwiftUpText";
import styles from "./HomeBlocks.module.css";

export function IndustriesChips({
  block,
  locale,
}: {
  block: Extract<Block, { type: "industriesChips" }>;
  locale: string;
}) {
  return (
    <section className={`${styles.section} ${styles.lavenderBand}`}>
      <Container>
        <div className={styles.sectionHead}>
          <FadeIn as="span" whenVisible className={styles.eyebrow}>
            {block.eyebrow}
          </FadeIn>
          <h2 className={styles.sectionHeadline}>
            <SwiftUpText text={block.headline} whenVisible />
          </h2>
          <p className={styles.sectionBody}>
            <SwiftUpText text={block.body} whenVisible lineDelay={0.12} delay={0.2} />
          </p>
        </div>
        <div className={styles.industryList}>
          {getIndustries(locale).map((industry, index) => (
            <FadeIn key={industry.slug} as="span" whenVisible delay={0.3 + index * 0.04}>
              <Link href={`/${locale}/industries/${industry.slug}`} className={styles.industryChip}>
                {industry.name}
              </Link>
            </FadeIn>
          ))}
        </div>
      </Container>
    </section>
  );
}
