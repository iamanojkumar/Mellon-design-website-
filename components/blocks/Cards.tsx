import type { Block } from "@/lib/blocks";
import { getIndustries, getServices } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { RevealGroup } from "@/components/motion/RevealGroup";
import { SwiftUpText } from "@/components/motion/SwiftUpText";
import { CursorGlowLink } from "./CursorGlowLink";
import styles from "./Cards.module.css";

type CardsProps = {
  block: Extract<Block, { type: "serviceCards" | "industryCards" }>;
  locale: string;
};

export function Cards({ block, locale }: CardsProps) {
  const isServices = block.type === "serviceCards";
  const items = isServices ? getServices(locale) : getIndustries(locale);
  const base = `/${locale}/${isServices ? "services" : "industries"}`;

  // Services can be grouped under category headings when the page defines them.
  const categories = block.type === "serviceCards" ? block.categories : undefined;
  const groups = categories
    ? categories
        .map((category) => ({
          label: category.label,
          items: getServices(locale).filter((service) => service.category === category.id),
        }))
        .filter((group) => group.items.length > 0)
    : null;

  if (groups) {
    return (
      <section className={styles.list}>
        <Container>
          {groups.map((group) => (
            <div key={group.label} className={styles.group}>
              <h2 className={styles.groupHeading}>
                <SwiftUpText text={group.label} whenVisible />
              </h2>
              <RevealGroup className={styles.grid}>
                {group.items.map((item) => (
                  <CursorGlowLink
                    key={item.slug}
                    href={`${base}/${item.slug}`}
                    className={styles.card}
                  >
                    <h3 className={styles.cardTitle}>{item.name}</h3>
                    <p className={styles.cardTagline}>{item.tagline}</p>
                    <span className={styles.cardLink}>{block.viewLink}</span>
                  </CursorGlowLink>
                ))}
              </RevealGroup>
            </div>
          ))}
        </Container>
      </section>
    );
  }

  return (
    <section className={styles.list}>
      <Container>
        <RevealGroup className={styles.grid}>
          {items.map((item) => (
            <CursorGlowLink key={item.slug} href={`${base}/${item.slug}`} className={styles.card}>
              <h2 className={styles.cardTitle}>{item.name}</h2>
              <p className={styles.cardTagline}>{item.tagline}</p>
              <span className={styles.cardLink}>{block.viewLink}</span>
            </CursorGlowLink>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
