import { getIndustries, getPage, getServices } from "@/lib/content";
import type { Block } from "@/lib/blocks";

export type MegaGroup = {
  label: string;
  items: { name: string; href: string; tagline?: string }[];
};

/** Mega-menu content keyed by the nav item's href (e.g. "/services"). */
export type MegaMenus = Record<string, MegaGroup[]>;

function groupBy(
  locale: string,
  base: string,
  categories: { id: string; label: string }[] | undefined,
  items: { slug: string; name: string; category?: string; tagline?: string }[],
  withTagline = false,
): MegaGroup[] {
  if (!categories) return [];
  return categories
    .map((category) => ({
      label: category.label,
      items: items
        .filter((item) => item.category === category.id)
        .map((item) => ({ name: item.name, href: `/${locale}${base}/${item.slug}`,
          ...(withTagline ? { tagline: item.tagline } : {}),
        })),
    }))
    .filter((group) => group.items.length > 0);
}

/** Categories come from the same index-page blocks that group the cards, so menu and pages never disagree. */
export function getMegaMenus(locale: string): MegaMenus {
  const serviceCards = getPage(locale, "services").blocks.find(
    (block): block is Extract<Block, { type: "serviceCards" }> => block.type === "serviceCards",
  );
  const industryCards = getPage(locale, "industries").blocks.find(
    (block): block is Extract<Block, { type: "industryCards" }> => block.type === "industryCards",
  );
  const menus: MegaMenus = {};
  const services = groupBy(locale, "/services", serviceCards?.categories, getServices(locale), true);
  const industries = groupBy(locale, "/industries", industryCards?.categories, getIndustries(locale));
  if (services.length > 0) menus["/services"] = services;
  if (industries.length > 0) menus["/industries"] = industries;
  return menus;
}
