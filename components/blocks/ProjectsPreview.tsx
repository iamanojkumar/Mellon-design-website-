import Link from "next/link";
import type { Block } from "@/lib/blocks";
import { getPublishedProjects } from "@/lib/projects";
import { Container } from "@/components/ui/Container";
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
          <span className={home.eyebrowDark}>{block.eyebrow}</span>
          <h2 className={home.sectionHeadline}>{block.headline}</h2>
          <p className={home.sectionBody}>{block.body}</p>
        </div>

        {projects.length === 0 ? (
          <p className={styles.empty}>{block.empty}</p>
        ) : (
          <div className={styles.grid}>
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                locale={locale}
                project={project}
                viewLink={block.viewLink}
              />
            ))}
          </div>
        )}

        {/* Always offered, even with nothing published: the listing page
            carries its own empty state and the link keeps the nav honest. */}
        <p className={styles.viewAll}>
          <Link href={`/${locale}/projects`}>{block.viewAll}</Link>
        </p>
      </Container>
    </section>
  );
}
