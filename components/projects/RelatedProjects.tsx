import Link from "next/link";
import { getSiteContent } from "@/lib/content";
import { getPublishedProjects } from "@/lib/projects";
import { getRelatedPicks } from "@/lib/related-work";
import { pickRelated, projectMatchesPage } from "@/lib/related-pick";
import { Container } from "@/components/ui/Container";
import { RevealGroup } from "@/components/motion/RevealGroup";
import { FadeIn } from "@/components/motion/HeroSequence";
import { SwiftUpText } from "@/components/motion/SwiftUpText";
import { ProjectCard } from "@/components/blocks/ProjectCards";
import home from "@/components/blocks/HomeBlocks.module.css";
import styles from "@/components/blocks/ProjectCards.module.css";

/**
 * "Related work" for service, industry and landing pages.
 *
 * Match-only: shows projects picked for the page in the admin (Related work),
 * then projects whose service (or "also relevant to" list) is this page's
 * service, or whose industry is this industry page. Unrelated work is never
 * used as filler; with nothing to show the section is not rendered. It appears
 * on its own the moment a match is published (the fetches are tagged
 * `projects:<locale>`, so the admin's publish or save revalidates these pages).
 * Landing pages read the picks of the service they belong to.
 */
export async function RelatedProjects({
  locale,
  service,
  category,
  showViewAll = true,
}: {
  locale: string;
  /** Service slug this page is about. */
  service?: string;
  /** Industry slug this page is about. */
  category?: string;
  /** Landing pages leave the full listing out so they stay self-contained. */
  showViewAll?: boolean;
}) {
  const kind = service ? "service" : "industry";
  const slug = service ?? category;
  if (!slug) return null;

  const [published, picks] = await Promise.all([
    getPublishedProjects(locale),
    getRelatedPicks(locale, kind, slug),
  ]);
  const projects = pickRelated(
    published.map((project) => ({ ...project, auto: projectMatchesPage(project, kind, slug) })),
    picks,
  );
  if (projects.length === 0) return null;

  const copy = getSiteContent(locale).relatedProjects;

  return (
    <section className={home.section}>
      <Container>
        <div className={home.sectionHead}>
          <FadeIn as="span" whenVisible className={home.eyebrowDark}>
            {copy.eyebrow}
          </FadeIn>
          <h2 className={home.sectionHeadline}>
            <SwiftUpText text={copy.headline} whenVisible />
          </h2>
          <p className={home.sectionBody}>
            <SwiftUpText text={copy.body} whenVisible lineDelay={0.12} delay={0.2} />
          </p>
        </div>

        <RevealGroup className={styles.grid}>
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              locale={locale}
              project={project}
              viewLink={copy.viewLink}
            />
          ))}
        </RevealGroup>

        {showViewAll && (
          <FadeIn whenVisible>
            <p className={styles.viewAll}>
              <Link href={`/${locale}/projects`}>{copy.viewAll}</Link>
            </p>
          </FadeIn>
        )}
      </Container>
    </section>
  );
}
