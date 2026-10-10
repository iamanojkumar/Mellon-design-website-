import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getSiteContent } from "@/lib/content";
import { enabledLocaleCodes } from "@/lib/locale";
import { getPost, getPostByPreviousSlug, getPublishedPosts, type Post } from "@/lib/posts";
import { buildProjectJsonLd, resolveSeo } from "@/lib/project-seo";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { getSiteUrl } from "@/lib/env";
import { HeroTint } from "@/components/ui/HeroTint";
import { normalizeHeroBg } from "@/lib/hero-tint";
import { ClosingCta } from "@/components/blocks/ClosingCta";
import { Container } from "@/components/ui/Container";
import { JsonLd } from "@/components/seo/JsonLd";
import { ParallaxImage } from "@/components/motion/ParallaxImage";
import { FadeIn } from "@/components/motion/HeroSequence";
import { SwiftUpText } from "@/components/motion/SwiftUpText";
import { revealOnLoadClass } from "@/components/motion/attachReveal";
import { ParallaxRichText } from "@/components/projects/ParallaxRichText";
import styles from "./page.module.css";

/**
 * Posts live in Supabase and are published from /admin/blog, so this route
 * keeps dynamicParams on like projects/[slug]: a post published a minute ago
 * resolves without a redeploy. A Supabase blip during a build must not fail
 * the deploy, hence the catch.
 */
export async function generateStaticParams() {
  const perLocale = await Promise.all(
    enabledLocaleCodes.map(async (locale) => {
      try {
        const posts = await getPublishedPosts(locale);
        return posts.map((post) => ({ locale, slug: post.slug }));
      } catch (error) {
        console.error(`[blog] could not list ${locale} for prerender`, error);
        return [];
      }
    }),
  );
  return perLocale.flat();
}

export const dynamicParams = true;
export const revalidate = 300;

type PageParams = { locale: string; slug: string };

/** Only published posts are public; drafts 404 exactly like a bad slug. */
async function findPublished(locale: string, slug: string): Promise<Post | undefined> {
  const post = await getPost(locale, slug);
  return post && post.status === "published" ? post : undefined;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await findPublished(locale, slug);
  if (!post) return {};

  const seo = resolveSeo({ ...post, schemaType: "BlogPosting" });
  return buildMetadata({
    locale,
    path: `/blog/${slug}`,
    title: seo.metaTitle,
    description: seo.metaDescription,
    ogImage: seo.ogImage,
    ogType: "article",
    twitterCard: post.heroImage ? "summary_large_image" : "summary",
    noindex: post.noindex,
    canonicalOverride: post.canonicalUrl ?? undefined,
    // Posts are per-locale writing, not translations of each other.
    locales: [locale],
  });
}

export default async function BlogPostPage({ params }: { params: Promise<PageParams> }) {
  const { locale, slug } = await params;
  const post = await findPublished(locale, slug);

  if (!post) {
    const renamed = await getPostByPreviousSlug(locale, slug);
    if (renamed && renamed.status === "published") {
      permanentRedirect(`/${locale}/blog/${renamed.slug}`);
    }
    notFound();
  }

  const site = getSiteContent(locale);
  const label = site.blogPage.label;
  const siteUrl = getSiteUrl();
  const localePrefix = `/${locale}`;
  const canonical = post.canonicalUrl || `${siteUrl}${localePrefix}/blog/${post.slug}`;
  const published = post.publishedAt ?? post.createdAt;

  return (
    <>
      <JsonLd data={buildProjectJsonLd(siteUrl, locale, canonical, { ...post, schemaType: "BlogPosting" })} />
      <JsonLd
        data={breadcrumbJsonLd(siteUrl, [
          { name: site.common.home, path: localePrefix },
          { name: label, path: `${localePrefix}/blog` },
          { name: post.title, path: `${localePrefix}/blog/${post.slug}` },
        ])}
      />

      <HeroTint color={post.heroBg} />
      <article className={styles.article}>
        {/* The tinted band: overline, heading, subtext and image. The header
            reads the same --page-tint, so the colour is continuous. */}
        <div className={styles.heroBand} data-hero-band="" data-tinted={normalizeHeroBg(post.heroBg) ? "" : undefined}>
        <Container>
          <p className={styles.meta}>
            <FadeIn as="span" whenVisible>
              {post.category ?? label} ·{" "}
              <time dateTime={published}>
                {new Date(published).toLocaleDateString(locale, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </FadeIn>
          </p>
          <h1 className={styles.title}>
            <SwiftUpText text={post.title} whenVisible />
          </h1>
          {post.summary && (
            <p className={styles.summary}>
              <SwiftUpText text={post.summary} whenVisible lineDelay={0.12} delay={0.2} />
            </p>
          )}

          {post.heroImage && (
            <div className={`${styles.heroFrame} ${revealOnLoadClass}`}>
              <ParallaxImage
                className={styles.hero}
                src={post.heroImage}
                alt={post.heroImageAlt ?? ""}
                width={post.heroImageWidth ?? undefined}
                height={post.heroImageHeight ?? undefined}
                priority
              />
            </div>
          )}
        </Container>
        </div>

        <Container>
          {post.content && (
            // Authored in the password-protected admin editor, the same trust
            // boundary as project bodies.
            <ParallaxRichText className={styles.body} html={post.content} />
          )}

          <p className={styles.back}>
            <Link href={`${localePrefix}/blog`}>← {label}</Link>
          </p>
        </Container>
      </article>

      <ClosingCta block={{ type: "closingCta", ...site.blogPage.cta }} locale={locale} />
    </>
  );
}
