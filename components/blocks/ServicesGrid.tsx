import type { Block } from "@/lib/blocks";
import { getServices, getSiteContent } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/motion/HeroSequence";
import { SwiftUpText } from "@/components/motion/SwiftUpText";
import { RevealGroup } from "@/components/motion/RevealGroup";
import { CursorGlowLink } from "./CursorGlowLink";
import { StackedPanels } from "./StackedPanels";
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
  const desktopOnlyHidden = (category?: string) =>
    Boolean(category && block.hideOnDesktop?.includes(category));
  const groups = block.categories
    ? block.categories
        .map((category) => ({
          label: category.label,
          hidden: desktopOnlyHidden(category.id),
          items: services.filter((service) => service.category === category.id),
        }))
        .filter((group) => group.items.length > 0)
    : [{ label: "", hidden: false, items: services }];
  return (
    <section className={`${styles.section} ${styles.greyBand}`}>
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
        {/* Wide screens stack the groups; phones and tablets stack the cards inside each group. */}
        <StackedPanels className={styles.stack} media="(min-width: 900px)">
        {groups.map((group) => (
          <div
            key={group.label}
            className={group.hidden ? `${styles.stackCard} ${styles.desktopHidden}` : styles.stackCard}
          >
            {group.label && (
              <h3 className={styles.groupHeading}>
                <SwiftUpText text={group.label} whenVisible />
              </h3>
            )}
            <StackedPanels
              className={styles.cardStack}
              media="(max-width: 899px)"
              selector=":scope > * > *"
              step={12}
              belowPrevious={Boolean(group.label)}
            >
            <RevealGroup className={styles.grid}>
              {group.items.map((service) => (
                <CursorGlowLink
                  key={service.slug}
                  href={`/${locale}/services/${service.slug}`}
                  className={
                    !group.hidden && desktopOnlyHidden(service.category)
                      ? `${styles.card} ${styles.desktopHidden}`
                      : styles.card
                  }
                >
                  <h4 className={styles.cardTitle}>{service.name}</h4>
                  <p className={styles.cardBody}>{service.tagline}</p>
                  <span className={styles.cardLink}>{site.common.learnMore}</span>
                </CursorGlowLink>
              ))}
            </RevealGroup>
            </StackedPanels>
          </div>
        ))}
        </StackedPanels>
      </Container>
    </section>
  );
}
