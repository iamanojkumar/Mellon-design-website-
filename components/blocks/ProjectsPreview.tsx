import Link from "next/link";
import type { Block } from "@/lib/blocks";
import { getPublishedProjects } from "@/lib/projects";
import { Container } from "@/components/ui/Container";
import { RevealGroup } from "@/components/motion/RevealGroup";
import { FadeIn } from "@/components/motion/HeroSequence";
import { SwiftUpText } from "@/components/motion/SwiftUpText";
import { ProjectCard } from "./ProjectCards";
import home from "./HomeBlocks.module.css";
import styles from "./ProjectCards.module.css";

/**
 * Home-page teaser for recent case studies. Shares ProjectCard and its grid
 * with the full listing so the two cannot drift apart visually, but borrows
 * the section heading styles from HomeBlocks so it sits in the same rhythm as
 * the services and industries sections above it.
 *
 * Async for the same reason as ProjectCards: the data is Supabase, tagged and
 * revalidated on publish rather than baked in at build.
 */
export async function ProjectsPreview({
  block,
  locale,
}: {
  block: Extract<Block, { type: "projectsPreview" }>;
  locale: string;
}) {
  const projects = (await getPublishedProjects(locale)).slice(0, block.limit);

  return (
    <section className={home.section}>
      <Container>
        <div className={home.sectionHead}>
          <FadeIn as="span" whenVisible className={home.eyebrowDark}>
            {block.eyebrow}
          </FadeIn>
          <h2 className={home.sectionHeadline}>
            <SwiftUpText text={block.headline} whenVisible />
          </h2>
          <p className={home.sectionBody}>
            <SwiftUpText text={block.body} whenVisible lineDelay={0.12} delay={0.2} />
          </p>
        </div>

        {projects.length === 0 ? (
          <p className={styles.empty}>{block.empty}</p>
        ) : (
          <RevealGroup className={styles.grid}>
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                locale={locale}
                project={project}
                viewLink={block.viewLink}
              />
            ))}
          </RevealGroup>
        )}

        {/* Always offered, even with nothing published: the listing page
            carries its own empty state and the link keeps the nav honest. */}
        <FadeIn whenVisible>
          <p className={styles.viewAll}>
            <Link href={`/${locale}/projects`}>{block.viewAll}</Link>
          </p>
        </FadeIn>
      </Container>
    </section>
  );
}
