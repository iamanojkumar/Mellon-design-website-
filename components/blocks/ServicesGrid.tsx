import type { Block } from "@/lib/blocks";
import { getServices, getSiteContent } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/motion/HeroSequence";
import { SwiftUpText } from "@/components/motion/SwiftUpText";
import { RevealGroup } from "@/components/motion/RevealGroup";
import { CursorGlowLink } from "./CursorGlowLink";
import styles from "./HomeBlocks.module.css";

export function ServicesGrid({
  block,
  locale,
}: {
  block: Extract<Block, { type: "servicesGrid" }>;
  locale: string;
}) {
  const site = getSiteContent(locale);
  const services = getServices(locale);
  const groups = block.categories
    ? block.categories
        .map((category) => ({
          label: category.label,
          items: services.filter((service) => service.category === category.id),
        }))
        .filter((group) => group.items.length > 0)
    : [{ label: "", items: services }];
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
        {groups.map((group) => (
          <div key={group.label} className={styles.group}>
            {group.label && (
              <h3 className={styles.groupHeading}>
                <SwiftUpText text={group.label} whenVisible />
              </h3>
            )}
            <RevealGroup className={styles.grid}>
              {group.items.map((service) => (
                <CursorGlowLink
                  key={service.slug}
                  href={`/${locale}/services/${service.slug}`}
                  className={styles.card}
                >
                  <h4 className={styles.cardTitle}>{service.name}</h4>
                  <p className={styles.cardBody}>{service.tagline}</p>
                  <span className={styles.cardLink}>{site.common.learnMore}</span>
                </CursorGlowLink>
              ))}
            </RevealGroup>
          </div>
        ))}
      </Container>
    </section>
  );
}
