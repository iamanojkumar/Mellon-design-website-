import Link from "next/link";
import { getSiteContent } from "@/lib/content";
import { getPublishedPosts, type Post } from "@/lib/posts";
import { pickRelated, postMatchesPost } from "@/lib/related-pick";
import { Container } from "@/components/ui/Container";
import { RevealGroup } from "@/components/motion/RevealGroup";
import { FadeIn } from "@/components/motion/HeroSequence";
import { SwiftUpText } from "@/components/motion/SwiftUpText";
import home from "@/components/blocks/HomeBlocks.module.css";
import styles from "./RelatedPosts.module.css";

/**
 * "Related articles" under a blog post. Match-only, like Related work: the
 * author's pins first (set in /admin/blog), then other published articles in the
 * same category that were not hidden. With none, nothing renders. The read is
 * tagged `posts:<locale>`, so publishing or saving in the admin refreshes it.
 */
export async function RelatedPosts({ locale, post }: { locale: string; post: Post }) {
  const published = await getPublishedPosts(locale);
  const related = pickRelated(
    published
      .filter((other) => other.id !== post.id)
      .map((other) => ({ ...other, auto: postMatchesPost(post, other) })),
    { pinned: post.relatedPinned, hidden: post.relatedHidden },
  );
  if (related.length === 0) return null;

  const { blogPage } = getSiteContent(locale);

  return (
    <section className={home.section} aria-labelledby="related-articles-heading">
      <Container>
        <div className={home.sectionHead}>
          <FadeIn as="span" whenVisible className={home.eyebrowDark}>
            {blogPage.relatedEyebrow}
          </FadeIn>
          <h2 id="related-articles-heading" className={home.sectionHeadline}>
            <SwiftUpText text={blogPage.relatedHeadline} whenVisible />
          </h2>
        </div>

        <RevealGroup as="ul" className={styles.list}>
          {related.map((item) => (
            <li key={item.id} className={styles.card}>
              <Link href={`/${locale}/blog/${item.slug}`} className={styles.link}>
                {item.category && <span className={styles.category}>{item.category}</span>}
                <h3 className={styles.title}>{item.title}</h3>
                {item.summary && <p className={styles.summary}>{item.summary}</p>}
                <span className={styles.more}>
                  {blogPage.readMore} <span aria-hidden="true">→</span>
                </span>
              </Link>
            </li>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
