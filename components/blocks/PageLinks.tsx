import type { Block } from "@/lib/blocks";
import { isCompanyPagePublished } from "@/lib/company-pages";
import { Container } from "@/components/ui/Container";
import { RevealGroup } from "@/components/motion/RevealGroup";
import { SwiftUpText } from "@/components/motion/SwiftUpText";
import { CursorGlowLink } from "./CursorGlowLink";
import styles from "./Cards.module.css";

/** Links from About to its child pages. Renders nothing until one is published. */
export function PageLinks({
  block,
  locale,
}: {
  block: Extract<Block, { type: "pageLinks" }>;
  locale: string;
}) {
  const links = block.links.filter((link) => isCompanyPagePublished(locale, link.slug));
  if (links.length === 0) return null;
  return (
    <section className={styles.list}>
      <Container>
        <h2 className={styles.groupHeading}>
          <SwiftUpText text={block.heading} whenVisible />
        </h2>
        <RevealGroup className={styles.grid}>
          {links.map((link) => (
            <CursorGlowLink
              key={link.slug}
              href={`/${locale}/about/${link.slug}`}
              className={styles.card}
            >
              <h3 className={styles.cardTitle}>{link.title}</h3>
              <p className={styles.cardTagline}>{link.body}</p>
            </CursorGlowLink>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
