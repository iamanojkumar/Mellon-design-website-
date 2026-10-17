/**
 * Page content model. A page is `{ meta, blocks }`: `meta` feeds SEO, and
 * `blocks` is an ordered list of sections. A locale controls layout by owning
 * its own `blocks` list (order, which blocks appear, their copy and images).
 * Adding a new block type = a type here + a component in components/blocks/
 * + a line in BlockRenderer.
 */

export type BlockCta = { label: string; href: string };

/**
 * Copy for the grouped projects listing (by service / by industry). Every field
 * is optional in a locale's page file; components/blocks/project-grouping.ts
 * supplies the English default for anything missing.
 *
 * `countOne` / `countOther` use `{count}`; `status` uses `{shown}` and `{total}`.
 * Two count strings rather than one because plural rules differ per language,
 * and "1 projects" is the bug this avoids.
 */
export type ProjectGroupingCopy = {
  toggleLabel: string;
  /** Accessible name for the row of quick-select chips. */
  filterLabel: string;
  /** The chip that clears the selection and shows every group. */
  allLabel: string;
  byService: string;
  byIndustry: string;
  countOne: string;
  countOther: string;
  showMore: string;
  viewAll: string;
  status: string;
};

export type Block =
  | {
      type: "hero";
      eyebrow: string;
      headline: string;
      subhead: string;
      primaryCta: BlockCta;
      secondaryCta: BlockCta;
    }
  | {
      type: "servicesGrid";
      eyebrow: string;
      headline: string;
      body: string;
      /** Same ids and labels as the services page; groups the cards under headings when present. */
      categories?: { id: string; label: string }[];
    }
  | { type: "industriesChips"; eyebrow: string; headline: string; body: string }
  | {
      type: "process";
      eyebrow: string;
      headline: string;
      body: string;
      steps: { title: string; body: string }[];
    }
  | { type: "closingCta"; headline: string; body?: string; cta: BlockCta; withForm?: boolean }
  | {
      type: "pageHero";
      eyebrow: string;
      headline: string;
      subhead: string;
      updated?: { label: string; date: string };
    }
  | {
      type: "textSections";
      /** `note: true` renders the section as a callout (e.g. a "more detail coming" aside) instead of a plain block. */
      sections: { heading: string; body: string; note?: boolean }[];
    }
  /** Cards linking to company pages (lib/company-pages.ts); only published ones render. */
  | { type: "pageLinks"; heading: string; links: { slug: string; title: string; body: string }[] }
  | { type: "serviceCards"; viewLink: string; categories?: { id: string; label: string }[] }
  | { type: "industryCards"; viewLink: string; categories?: { id: string; label: string }[] }
  /**
   * Case studies from Supabase rather than this JSON, so both project blocks
   * carry their own `empty` copy: a locale with nothing published yet renders
   * a written empty state instead of a blank gap. `projectCards` is the full
   * listing; `projectsPreview` is the home-page teaser and takes a `limit`.
   */
  | { type: "projectCards"; viewLink: string; empty: string; grouping?: Partial<ProjectGroupingCopy> }
  | {
      type: "projectsPreview";
      eyebrow: string;
      headline: string;
      body: string;
      viewLink: string;
      viewAll: string;
      empty: string;
      limit: number;
    }
  | {
      type: "contact";
      eyebrow: string;
      headline: string;
      subhead: string;
      directEmailLabel: string;
    };

export type PageMeta = { title: string; description: string };

export type PageDoc = { meta: PageMeta; blocks: Block[] };

export type PageKey =
  | "home"
  | "about"
  | "services"
  | "industries"
  | "projects"
  | "contact"
  | "privacy"
  | "about-ai"
  | "about-process"
  | "about-security"
  | "about-sustainability";
