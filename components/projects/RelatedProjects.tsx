import Link from "next/link";
import { getSiteContent } from "@/lib/content";
import { getPublishedProjects } from "@/lib/projects";
import { Container } from "@/components/ui/Container";
import { RevealGroup } from "@/components/motion/RevealGroup";
import { FadeIn } from "@/components/motion/HeroSequence";
import { SwiftUpText } from "@/components/motion/SwiftUpText";
import { ProjectCard } from "@/components/blocks/ProjectCards";
import home from "@/components/blocks/HomeBlocks.module.css";
import styles from "@/components/blocks/ProjectCards.module.css";

const LIMIT = 3;

/**
 * "Related work" for service, industry and landing pages.
 *
 * Renders nothing when the locale has no published projects, and appears on its
 * own the moment one is published (the fetch is tagged `projects:<locale>`, so
 * the admin's publish revalidates these pages). Projects matching the page's
 * service or industry come first; the rest of the locale's latest work fills
 * the remaining slots, so the section is visible whenever there is anything to
 * show rather than only on an exact match.
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
  const published = await getPublishedProjects(locale);
  if (published.length === 0) return null;

  const matches = (project: { service: string; category: string }) =>
    (!!service && project.service === service) || (!!category && project.category === category);
  const projects = [
    ...published.filter(matches),
    ...published.filter((project) => !matches(project)),
  ].slice(0, LIMIT);

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
