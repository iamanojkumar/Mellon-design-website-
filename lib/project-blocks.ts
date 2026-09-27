/**
 * Structured content blocks for a project, alongside the rich-text body.
 *
 * Client-safe (no server imports) so the admin editor can use these at runtime,
 * same reasoning as lib/project-fields.ts. Written against plain shapes so a
 * future content type can reuse the whole block system.
 *
 * On structured data — checked against Google's current docs, not assumed:
 *  - Video is the only block here that still earns a rich result (VideoObject).
 *  - FAQ rich results were restricted to gov/health sites in Sept 2023 and
 *    removed entirely in May 2026. We still emit valid FAQPage markup because
 *    other engines and answer systems read it, but it wins nothing in Google.
 *  - Testimonials deliberately emit NO Review/AggregateRating. Google rules out
 *    star snippets when "the entity that's being reviewed controls the reviews
 *    about itself", so self-serving review markup is a guidelines risk, not a win.
 */

export type FaqBlock = {
  type: "faq";
  heading: string;
  items: { question: string; answer: string }[];
};

export type TestimonialBlock = {
  type: "testimonial";
  quote: string;
  author: string;
  role: string;
  company: string;
};

export type StatsBlock = {
  type: "stats";
  heading: string;
  items: { value: string; label: string }[];
};

export type GalleryBlock = {
  type: "gallery";
  heading: string;
  images: { src: string; alt: string }[];
};

export type VideoBlock = {
  type: "video";
  title: string;
  description: string;
  /** Page the video lives on, or an embed URL. */
  url: string;
  thumbnail: string;
  /** ISO date — VideoObject wants uploadDate to be eligible. */
  uploadDate: string;
};

export type ProjectBlock =
  | FaqBlock
  | TestimonialBlock
  | StatsBlock
  | GalleryBlock
  | VideoBlock;

export type ProjectBlockType = ProjectBlock["type"];

export const BLOCK_TYPES: {
  type: ProjectBlockType;
  label: string;
  /** Shown in the editor so nobody expects a rich result that no longer exists. */
  schemaNote: string;
}[] = [
  { type: "stats", label: "Results / stats", schemaNote: "Design only — no structured data." },
  {
    type: "testimonial",
    label: "Testimonial",
    schemaNote: "Design only — self-serving reviews can't earn star snippets.",
  },
  {
    type: "faq",
    label: "FAQ",
    schemaNote: "Emits FAQPage. Google dropped FAQ rich results in 2026; other engines still read it.",
  },
  { type: "gallery", label: "Image gallery", schemaNote: "Design only — alt text feeds image search." },
  { type: "video", label: "Video", schemaNote: "Emits VideoObject — still a real Google rich result." },
];

export function createBlock(type: ProjectBlockType): ProjectBlock {
  switch (type) {
    case "faq":
      return { type, heading: "Frequently asked questions", items: [{ question: "", answer: "" }] };
    case "testimonial":
      return { type, quote: "", author: "", role: "", company: "" };
    case "stats":
      return { type, heading: "Results", items: [{ value: "", label: "" }] };
    case "gallery":
      return { type, heading: "", images: [{ src: "", alt: "" }] };
    case "video":
      return { type, title: "", description: "", url: "", thumbnail: "", uploadDate: "" };
  }
}

/** Drops empty rows so half-filled blocks don't reach the page or the markup. */
export function pruneBlocks(blocks: ProjectBlock[]): ProjectBlock[] {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "faq":
          return {
            ...block,
            items: block.items.filter((item) => item.question.trim() && item.answer.trim()),
          };
        case "stats":
          return { ...block, items: block.items.filter((item) => item.value.trim()) };
        case "gallery":
          return { ...block, images: block.images.filter((image) => image.src.trim()) };
        default:
          return block;
      }
    })
    .filter((block) => {
      switch (block.type) {
        case "faq":
          return block.items.length > 0;
        case "stats":
          return block.items.length > 0;
        case "gallery":
          return block.images.length > 0;
        case "testimonial":
          return Boolean(block.quote.trim());
        case "video":
          return Boolean(block.url.trim());
      }
    });
}

/** Runtime guard for rows coming back from JSONB. */
export function parseBlocks(value: unknown): ProjectBlock[] {
  if (!Array.isArray(value)) return [];
  const known = new Set(BLOCK_TYPES.map((entry) => entry.type));
  return value.filter(
    (entry): entry is ProjectBlock =>
      typeof entry === "object" && entry !== null && known.has((entry as ProjectBlock).type),
  );
}
