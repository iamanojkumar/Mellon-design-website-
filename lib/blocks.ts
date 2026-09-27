/**
 * Page content model. A page is `{ meta, blocks }`: `meta` feeds SEO, and
 * `blocks` is an ordered list of sections. A locale controls layout by owning
 * its own `blocks` list (order, which blocks appear, their copy and images).
 * Adding a new block type = a type here + a component in components/blocks/
 * + a line in BlockRenderer.
 */

export type BlockCta = { label: string; href: string };

export type Block =
  | {
      type: "hero";
      eyebrow: string;
      headline: string;
      subhead: string;
      primaryCta: BlockCta;
      secondaryCta: BlockCta;
      /**
       * Cycling image stack, front to back. With more than one image, the
       * front slot rotates through them on a timer (HeroImageStack); images
       * beyond the 3rd stay queued in rotation rather than shown at once.
       */
      images: { src: string; alt: string; width: number; height: number }[];
    }
  | { type: "servicesGrid"; eyebrow: string; headline: string; body: string }
  | { type: "industriesChips"; eyebrow: string; headline: string; body: string }
  | {
      type: "process";
      eyebrow: string;
      headline: string;
      body: string;
      steps: { title: string; body: string }[];
    }
  | { type: "closingCta"; headline: string; body?: string; cta: BlockCta }
  | {
      type: "pageHero";
      eyebrow: string;
      headline: string;
      subhead: string;
      updated?: { label: string; date: string };
    }
  | { type: "textSections"; sections: { heading: string; body: string }[] }
  | { type: "serviceCards"; viewLink: string }
  | { type: "industryCards"; viewLink: string }
  /**
   * Case studies from Supabase rather than this JSON, so both project blocks
   * carry their own `empty` copy: a locale with nothing published yet renders
   * a written empty state instead of a blank gap. `projectCards` is the full
   * listing; `projectsPreview` is the home-page teaser and takes a `limit`.
   */
  | { type: "projectCards"; viewLink: string; empty: string }
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
  | "privacy";
