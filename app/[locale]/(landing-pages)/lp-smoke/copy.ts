/**
 * This page's copy, keyed by locale. A locale with no entry inherits along its
 * fallback chain (en-IN → en-GB → en-US), so only add an entry where the
 * wording, currency or offer differs from the locale it falls back to.
 */
export type LandingCopy = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  headline: string;
  summary: string;
  cta: string;
};

export const copy: Record<string, LandingCopy> = {
  "en-US": {
    metaTitle: "Your offer — Mellon",
    metaDescription: "One sentence on what the visitor gets.",
    eyebrow: "Free for US teams",
    headline: "The promise, in one line",
    summary: "Two sentences on why it matters and what happens next.",
    cta: "Get it",
  },
};
