import type { Metadata } from "next";
import Link from "next/link";
import { getSiteContent } from "@/lib/content";
import { enabledLocaleCodes } from "@/lib/locale";
import { getPublishedPosts } from "@/lib/posts";
import { buildMetadata } from "@/lib/seo";
import { ClosingCta } from "@/components/blocks/ClosingCta";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/motion/HeroSequence";
import { SwiftUpText } from "@/components/motion/SwiftUpText";
import { RevealGroup } from "@/components/motion/RevealGroup";
import styles from "./page.module.css";

export function generateStaticParams() {
  return enabledLocaleCodes.map((locale) => ({ locale }));
}

export const dynamicParams = false;

/** Publishing revalidates the "posts:<locale>" tag; this bounds a stale build cache. */
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { blogPage } = getSiteContent(locale);
  return buildMetadata({
    locale,
    path: "/blog",
    title: blogPage.label,
    description: blogPage.intro,
  });
}

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { blogPage } = getSiteContent(locale);
  const posts = await getPublishedPosts(locale);

  return (
    <>
    <section className={styles.section}>
      <Container>
        <p className={styles.eyebrow}>
          <FadeIn as="span" whenVisible>
            {blogPage.label}
          </FadeIn>
        </p>
        <h1 className={styles.headline}>
          <SwiftUpText text={blogPage.headline} whenVisible />
        </h1>
        <p className={styles.intro}>
          <SwiftUpText text={blogPage.intro} whenVisible lineDelay={0.12} delay={0.2} />
        </p>

        {posts.length === 0 ? (
          <p className={styles.empty}>
            <FadeIn as="span" whenVisible>
              {blogPage.empty}
            </FadeIn>
          </p>
        ) : (
          <RevealGroup as="ul" className={styles.list}>
            {posts.map((post) => (
              <li key={post.id} className={styles.card}>
                <Link href={`/${locale}/blog/${post.slug}`} className={styles.link}>
                  {post.category && <span className={styles.category}>{post.category}</span>}
                  <h2 className={styles.cardTitle}>{post.title}</h2>
                  {post.summary && <p className={styles.cardSummary}>{post.summary}</p>}
                  <span className={styles.more}>{blogPage.readMore} →</span>
                </Link>
              </li>
            ))}
          </RevealGroup>
        )}
      </Container>
    </section>
      <ClosingCta block={{ type: "closingCta", ...blogPage.cta }} locale={locale} />
    </>
  );
}
