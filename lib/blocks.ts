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
  | "contact"
  | "privacy";
