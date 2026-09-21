import type { Block } from "@/lib/blocks";
import { Cards } from "./Cards";
import { ClosingCta } from "./ClosingCta";
import { ContactSection } from "./ContactSection";
import { Hero } from "./Hero";
import { IndustriesChips } from "./IndustriesChips";
import { PageHero } from "./PageHero";
import { Process } from "./Process";
import { ServicesGrid } from "./ServicesGrid";
import { TextSections } from "./TextSections";

/** Renders a page's ordered block list. Unknown block types are skipped. */
export function BlockRenderer({ blocks, locale }: { blocks: Block[]; locale: string }) {
  return (
    <>
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;
        switch (block.type) {
          case "hero":
            return <Hero key={key} block={block} locale={locale} />;
          case "servicesGrid":
            return <ServicesGrid key={key} block={block} locale={locale} />;
          case "industriesChips":
            return <IndustriesChips key={key} block={block} locale={locale} />;
          case "process":
            return <Process key={key} block={block} />;
          case "closingCta":
            return <ClosingCta key={key} block={block} locale={locale} />;
          case "pageHero":
            return <PageHero key={key} block={block} locale={locale} />;
          case "textSections":
            return <TextSections key={key} block={block} locale={locale} />;
          case "serviceCards":
          case "industryCards":
            return <Cards key={key} block={block} locale={locale} />;
          case "contact":
            return <ContactSection key={key} block={block} locale={locale} />;
          default:
            return null;
        }
      })}
    </>
  );
}
