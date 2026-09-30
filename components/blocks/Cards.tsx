import type { Block } from "@/lib/blocks";
import { getIndustries, getServices } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { RevealGroup } from "@/components/motion/RevealGroup";
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
