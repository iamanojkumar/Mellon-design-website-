import type { Block } from "@/lib/blocks";
import { Container } from "@/components/ui/Container";
import styles from "./HomeBlocks.module.css";

export function Process({ block }: { block: Extract<Block, { type: "process" }> }) {
  return (
    <section className={styles.section}>
      <Container>
        <div className={styles.processGrid}>
          <div>
            <span className={styles.eyebrowDark}>{block.eyebrow}</span>
            <h2 className={styles.sectionHeadline}>{block.headline}</h2>
            <p className={styles.sectionBody}>{block.body}</p>
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
