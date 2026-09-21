import type { Block } from "@/lib/blocks";
import { getSiteContent } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import styles from "./TextSections.module.css";

export function TextSections({
  block,
  locale,
}: {
  block: Extract<Block, { type: "textSections" }>;
  locale: string;
}) {
  const { email } = getSiteContent(locale).org;
  return (
    <section className={styles.body}>
      <Container>
        <div className={styles.sections}>
          {block.sections.map((section) => (
            <div key={section.heading} className={styles.block}>
              <h2 className={styles.blockHeading}>{section.heading}</h2>
              <p className={styles.blockBody}>{section.body.replaceAll("{email}", email)}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
