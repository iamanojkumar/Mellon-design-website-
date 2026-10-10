import { z } from "zod";
import type { ServiceLandingCopy } from "@/components/landing/ServiceLanding";

/**
 * Content model for landing pages created in the admin. Safe on both sides of
 * the wire (no server imports): the editor, the AI route and the public route
 * all share the schema and the rule checks below.
 *
 * `landingCopySchema` mirrors ServiceLandingCopy field for field, so a row can
 * be rendered by the existing ServiceLanding component unchanged. It is run on
 * every write and again on render, because the column is free-form jsonb.
 */

const text = z.string().trim();
const titled = z.object({ title: text, text });

export const landingCopySchema = z.object({
  metaTitle: text,
  metaDescription: text,
  serviceName: text,
  serviceType: text,
  areaServed: text,
  headline: text,
  summary: text,
  approach: z.object({ heading: text, intro: text, steps: z.array(titled) }),
  included: z.object({ heading: text, intro: text, items: z.array(titled) }),
  partner: z.object({ heading: text, items: z.array(titled) }),
  caseStudies: z
    .object({ heading: text, cta: text, items: z.array(z.object({ name: text })) })
    .optional(),
  related: z.object({ text, label: text, href: text }).optional(),
  faq: z.object({
    heading: text,
    items: z.array(z.object({ question: text, answer: text })),
  }),
  quote: z.object({ heading: text, text }),
});

export type LandingCopy = z.infer<typeof landingCopySchema>;

// Compile-time guarantee that the schema and the layout's prop type stay in step.
type _AssignableToLayout = LandingCopy extends ServiceLandingCopy ? true : never;
const _check: _AssignableToLayout = true;
void _check;

export function blankLandingCopy(): LandingCopy {
  return {
    metaTitle: "",
    metaDescription: "",
    serviceName: "",
    serviceType: "",
    areaServed: "",
    headline: "",
    summary: "",
    approach: { heading: "", intro: "", steps: [] },
    included: { heading: "", intro: "", items: [] },
    partner: { heading: "", items: [] },
    faq: { heading: "", items: [] },
    quote: { heading: "", text: "" },
  };
}

/**
 * Parses stored jsonb into a full copy object, filling anything missing with
 * blanks. Never throws: a half-written draft must still open in the editor.
 */
export function coerceLandingCopy(raw: unknown): LandingCopy {
  const base = blankLandingCopy();
  const parsed = landingCopySchema.partial().safeParse(raw);
  if (!parsed.success) return base;
  const data = parsed.data;
  return {
    ...base,
    ...data,
    approach: { ...base.approach, ...data.approach },
    included: { ...base.included, ...data.included },
    partner: { ...base.partner, ...data.partner },
    faq: { ...base.faq, ...data.faq },
    quote: { ...base.quote, ...data.quote },
  };
}

/** What the assistant may change in one go: any subset of the copy. */
export const landingPatchSchema = landingCopySchema.deepPartial();
export type LandingPatch = z.infer<typeof landingPatchSchema>;

/** Merges a patch into a copy. Objects merge key by key; arrays are replaced whole. */
export function applyLandingPatch(copy: LandingCopy, patch: LandingPatch): LandingCopy {
  const next = { ...copy } as Record<string, unknown>;
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    const current = (copy as Record<string, unknown>)[key];
    next[key] =
      value && typeof value === "object" && !Array.isArray(value) && current && typeof current === "object"
        ? { ...(current as object), ...(value as object) }
        : value;
  }
  return next as LandingCopy;
}

// ---------------------------------------------------------------------------
// Slug rules
// ---------------------------------------------------------------------------

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugifyLanding(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------------------------------------------------------------------------
// Rule checks (CLAUDE.md thin-content rule, brand voice, SEO basics)
// ---------------------------------------------------------------------------

export type RuleStatus = "pass" | "fail" | "warn";
export type RuleResult = { id: string; label: string; status: RuleStatus; detail: string };

/** Another page's identifying copy, for the uniqueness and near-duplicate checks. */
export type OtherPage = {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  headline: string;
  body: string;
};

/** All visible body copy, excluding header/footer chrome and CTA labels. */
export function bodyText(copy: LandingCopy): string {
  return [
    copy.summary,
    copy.approach.intro,
    ...copy.approach.steps.flatMap((s) => [s.title, s.text]),
    copy.included.intro,
    ...copy.included.items.flatMap((s) => [s.title, s.text]),
    ...copy.partner.items.flatMap((s) => [s.title, s.text]),
    ...(copy.faq.items.flatMap((s) => [s.question, s.answer])),
    copy.quote.text,
  ]
    .filter(Boolean)
    .join(" ");
}

export function wordCount(value: string): number {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

function shingles(value: string, size = 4): Set<string> {
  const words = value.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
  const set = new Set<string>();
  for (let i = 0; i + size <= words.length; i++) set.add(words.slice(i, i + size).join(" "));
  return set;
}

/** Share of this page's 4-word phrases that also appear in `other` (0..1). */
export function overlap(a: string, b: string): number {
  const left = shingles(a);
  if (left.size === 0) return 0;
  const right = shingles(b);
  let shared = 0;
  for (const item of left) if (right.has(item)) shared++;
  return shared / left.size;
}

const norm = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

export function checkLandingRules(input: {
  copy: LandingCopy;
  slug: string;
  indexable: boolean;
  demandNote: string;
  others: OtherPage[];
}): RuleResult[] {
  const { copy, slug, indexable, demandNote, others } = input;
  const results: RuleResult[] = [];
  const add = (id: string, label: string, status: RuleStatus, detail: string) =>
    results.push({ id, label, status, detail });

  // 1. Substance
  const words = wordCount(bodyText(copy));
  const sections = [
    copy.approach.steps.length,
    copy.included.items.length,
    copy.partner.items.length,
    copy.faq.items.length,
  ].filter((n) => n > 0).length;
  const thinStatus: RuleStatus = words >= 300 ? "pass" : indexable ? "fail" : "warn";
  add("words", "At least 300 words of body copy", thinStatus, `${words} words (needs 300 to be indexable)`);
  add(
    "sections",
    "A section beyond hero and CTA",
    sections > 0 ? "pass" : indexable ? "fail" : "warn",
    sections > 0 ? `${sections} content section(s) filled` : "Add steps, deliverables, fit points or FAQs",
  );

  // 2/3/4. Unique intent, not a near-duplicate, unique metadata
  const dupMeta = (field: keyof Pick<OtherPage, "metaTitle" | "metaDescription" | "headline">, value: string) =>
    value && others.find((o) => norm(o[field]) === norm(value));
  for (const [field, label] of [
    ["metaTitle", "Unique meta title"],
    ["metaDescription", "Unique meta description"],
    ["headline", "Unique H1 (headline)"],
  ] as const) {
    const value = copy[field];
    if (!value) {
      add(field, label, "fail", "Empty");
      continue;
    }
    const clash = dupMeta(field, value);
    add(field, label, clash ? "fail" : "pass", clash ? `Same as /${clash.slug}` : "Distinct across landing pages");
  }
  const body = bodyText(copy);
  const closest = others
    .map((o) => ({ slug: o.slug, share: overlap(body, o.body) }))
    .sort((a, b) => b.share - a.share)[0];
  if (closest && words > 0) {
    const pct = Math.round(closest.share * 100);
    add(
      "duplicate",
      "Under 60% shared copy with another page",
      closest.share > 0.6 ? "fail" : closest.share > 0.4 ? "warn" : "pass",
      `Closest match /${closest.slug} at ${pct}%`,
    );
  }

  // Meta length (search results truncate)
  add(
    "title-length",
    "Meta title fits search results (60 characters)",
    copy.metaTitle.length === 0 ? "fail" : copy.metaTitle.length <= 60 ? "pass" : "warn",
    `${copy.metaTitle.length} characters`,
  );
  add(
    "description-length",
    "Meta description fits (155 characters)",
    copy.metaDescription.length === 0 ? "fail" : copy.metaDescription.length <= 160 ? "pass" : "warn",
    `${copy.metaDescription.length} characters`,
  );

  // 5. Real value: no placeholder markers left in
  const fullText = JSON.stringify(copy);
  const placeholders = (fullText.match(/\[Confirm:[^\]]*\]|lorem ipsum|TODO|TBD/gi) ?? []).length;
  add(
    "placeholders",
    "No placeholder or [Confirm] markers left",
    placeholders === 0 ? "pass" : "warn",
    placeholders === 0 ? "Clean" : `${placeholders} marker(s) to resolve before publishing`,
  );

  // Superlatives (brand voice)
  const superlatives = (fullText.match(/\b(best|world-class|leading|number one|#1|cutting-edge|seamless|holistic|synergy)\b/gi) ?? []);
  add(
    "superlatives",
    "No superlatives or buzzwords (brand voice)",
    superlatives.length === 0 ? "pass" : "warn",
    superlatives.length === 0 ? "Clean" : `Found: ${[...new Set(superlatives.map((s) => s.toLowerCase()))].join(", ")}`,
  );

  // Structure
  add(
    "structure",
    "Headline, summary and form heading present",
    copy.headline && copy.summary && copy.quote.heading ? "pass" : "fail",
    copy.headline && copy.summary && copy.quote.heading ? "OK" : "One of headline, summary or quote heading is empty",
  );

  // Demand rule record
  add(
    "demand",
    "Demand verdict and evidence recorded",
    demandNote.trim().length >= 20 ? "pass" : indexable ? "warn" : "pass",
    demandNote.trim().length >= 20 ? "Recorded" : "Name the target phrase, market and the evidence (or mark Unknown)",
  );

  add(
    "slug",
    "Slug is valid",
    SLUG_PATTERN.test(slug) ? "pass" : "fail",
    SLUG_PATTERN.test(slug) ? `/${slug}` : "Lowercase letters, numbers and hyphens only",
  );

  return results;
}

/** One plain-text block of the results, for the assistant's context. */
export function describeRuleResults(results: RuleResult[]): string {
  return results.map((r) => `- [${r.status.toUpperCase()}] ${r.label}: ${r.detail}`).join("\n");
}
