import Link from "next/link";
import type { Block } from "@/lib/blocks";
import { getServices, getSiteContent } from "@/lib/content";
import { Container } from "@/components/ui/Container";
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
    <section className={styles.section}>
      <Container>
        <div className={styles.sectionHead}>
          <span className={styles.eyebrowDark}>{block.eyebrow}</span>
          <h2 className={styles.sectionHeadline}>{block.headline}</h2>
          <p className={styles.sectionBody}>{block.body}</p>
        </div>
        <div className={styles.grid}>
          {getServices(locale).map((service) => (
            <Link key={service.slug} href={`/${locale}/services/${service.slug}`} className={styles.card}>
              <h3 className={styles.cardTitle}>{service.name}</h3>
              <p className={styles.cardBody}>{service.tagline}</p>
              <span className={styles.cardLink}>{site.common.learnMore}</span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
