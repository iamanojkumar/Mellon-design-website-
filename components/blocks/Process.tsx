import type { Block } from "@/lib/blocks";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/motion/HeroSequence";
import { SwiftUpText } from "@/components/motion/SwiftUpText";
import styles from "./HomeBlocks.module.css";

export function Process({ block }: { block: Extract<Block, { type: "process" }> }) {
  return (
    <section className={`${styles.section} ${styles.greyBand}`}>
      <Container>
        <div className={styles.processGrid}>
          <div>
            <FadeIn as="span" whenVisible className={styles.eyebrowDark}>
              {block.eyebrow}
            </FadeIn>
            <h2 className={styles.sectionHeadline}>
              <SwiftUpText text={block.headline} whenVisible />
            </h2>
            <p className={styles.sectionBody}>
              <SwiftUpText text={block.body} whenVisible lineDelay={0.12} delay={0.2} />
            </p>
          </div>
          <ol className={styles.steps}>
            {block.steps.map((step, index) => (
              <li key={step.title} className={styles.step}>
                <span className={styles.stepNumber}>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepBody}>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
