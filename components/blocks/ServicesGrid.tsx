import Link from "next/link";
import type { Block } from "@/lib/blocks";
import { getServices, getSiteContent } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/motion/HeroSequence";
import { SwiftUpText } from "@/components/motion/SwiftUpText";
import { RevealGroup } from "@/components/motion/RevealGroup";
import styles from "./HomeBlocks.module.css";

export function ServicesGrid({
  block,
  locale,
}: {
  block: Extract<Block, { type: "servicesGrid" }>;
  locale: string;
}) {
  const site = getSiteContent(locale);
  return (
    <section className={`${styles.section} ${styles.mintBand}`}>
      <Container>
        <div className={styles.sectionHead}>
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
        <RevealGroup className={styles.grid}>
          {getServices(locale).map((service) => (
            <Link key={service.slug} href={`/${locale}/services/${service.slug}`} className={styles.card}>
              <h3 className={styles.cardTitle}>{service.name}</h3>
              <p className={styles.cardBody}>{service.tagline}</p>
              <span className={styles.cardLink}>{site.common.learnMore}</span>
            </Link>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
