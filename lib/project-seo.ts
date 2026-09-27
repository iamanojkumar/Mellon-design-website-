import type { SchemaType } from "@/lib/projects";
import type { ProjectBlock } from "@/lib/project-blocks";
import { getSiteContent } from "@/lib/content";
import { DEFAULT_OG_IMAGE } from "@/lib/seo";

/**
 * Structured data for an editorial piece (today: a project/case study).
 *
 * Takes plain fields rather than a Project so a future content type can reuse
 * it unchanged. Follows lib/seo.ts's existing JSON-LD builders, and references
 * the same Organization node they emit (`{siteUrl}/#organization`) instead of
 * restating the company facts, so there is one organisation in the graph.
 *
 * Property choice follows Google's Article guidance: no properties are strictly
 * required, and the recommended set is headline, image, datePublished,
 * dateModified, author and publisher.
 */

export type SeoSource = {
  title: string;
  summary: string | null;
  heroImage: string | null;
  heroImageAlt: string | null;
  heroImageWidth: number | null;
  heroImageHeight: number | null;
  metaTitle: string | null;
  metaDescription: string | null;
  focusKeyword: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  schemaType: SchemaType;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  blocks?: ProjectBlock[];
};

/**
 * Extra graph nodes contributed by content blocks.
 *
 * Only two block types produce markup, and only one of them still wins anything
 * in Google:
 *  - video  -> VideoObject, a live rich result.
 *  - faq    -> FAQPage. Google removed FAQ rich results in May 2026; this stays
 *              because other engines and answer systems still parse it.
 * Testimonials are deliberately absent: Google rules out star snippets for
 * reviews the reviewed entity controls, so marking our own testimonials up as
 * Review would be a guidelines risk with no upside.
 */
function blockJsonLd(siteUrl: string, canonical: string, blocks: ProjectBlock[]) {
  const nodes: Record<string, unknown>[] = [];

  for (const block of blocks) {
    if (block.type === "faq" && block.items.length > 0) {
      nodes.push({
        "@type": "FAQPage",
        "@id": `${canonical}#faq`,
        mainEntity: block.items.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      });
    }

    if (block.type === "video" && block.url.trim()) {
      nodes.push({
        "@type": "VideoObject",
        "@id": `${canonical}#video`,
        name: block.title || undefined,
        description: block.description || undefined,
        contentUrl: block.url,
        thumbnailUrl: block.thumbnail ? absolute(siteUrl, block.thumbnail) : undefined,
        uploadDate: block.uploadDate || undefined,
      });
    }
  }

  return nodes;
}

/**
 * What actually goes to search/social once per-field overrides are applied.
 * Each override falls back through to the on-page copy, so an editor only
 * fills the ones where the SERP/social wording should differ from the page.
 */
export function resolveSeo(source: SeoSource) {
  const metaTitle = source.metaTitle || source.title;
  const metaDescription = source.metaDescription || source.summary || "";
  return {
    metaTitle,
    metaDescription,
    // OG falls back to the meta fields, which in turn fall back to the page copy.
    ogTitle: source.ogTitle || metaTitle,
    ogDescription: source.ogDescription || metaDescription,
    ogImage: source.ogImage || source.heroImage || DEFAULT_OG_IMAGE,
  };
}

function absolute(siteUrl: string, url: string): string {
  return url.startsWith("http") ? url : `${siteUrl}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function buildProjectJsonLd(
  siteUrl: string,
  locale: string,
  canonical: string,
  source: SeoSource,
) {
  const { org } = getSiteContent(locale);
  const orgId = `${siteUrl}/#organization`;
  const resolved = resolveSeo(source);

  // An ImageObject with dimensions is preferred over a bare URL when we know
  // the size; Google uses it to judge whether the image is usable.
  const imageUrl = absolute(siteUrl, resolved.ogImage);
  const image =
    source.heroImageWidth && source.heroImageHeight && resolved.ogImage === source.heroImage
      ? {
          "@type": "ImageObject",
          url: imageUrl,
          width: source.heroImageWidth,
          height: source.heroImageHeight,
          ...(source.heroImageAlt ? { caption: source.heroImageAlt } : {}),
        }
      : imageUrl;

  const main = {
    "@type": source.schemaType,
    "@id": `${canonical}#${source.schemaType.toLowerCase()}`,
    headline: resolved.metaTitle,
    name: source.title,
    description: resolved.metaDescription || undefined,
    image,
    url: canonical,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    inLanguage: locale,
    datePublished: source.publishedAt ?? source.createdAt,
    dateModified: source.updatedAt,
    author: { "@id": orgId, "@type": "Organization", name: org.legalName, url: siteUrl },
    publisher: { "@id": orgId },
    keywords: source.focusKeyword || undefined,
  };

  const extras = blockJsonLd(siteUrl, canonical, source.blocks ?? []);

  // One node stays a plain object; blocks that contribute markup turn it into a
  // graph, which is how you legitimately put an FAQPage and a CreativeWork on
  // the same URL.
  return extras.length > 0
    ? { "@context": "https://schema.org", "@graph": [main, ...extras] }
    : { "@context": "https://schema.org", ...main };
}
