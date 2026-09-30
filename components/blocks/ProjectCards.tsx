import Link from "next/link";
import type { Block } from "@/lib/blocks";
import { getPublishedProjects } from "@/lib/projects";
import { Container } from "@/components/ui/Container";
import { ParallaxImage } from "@/components/motion/ParallaxImage";
import { RevealGroup } from "@/components/motion/RevealGroup";
import styles from "./ProjectCards.module.css";

/**
 * The full case-study listing. Async because projects come from Supabase, not
 * the content JSON — the fetch is tagged `projects:<locale>` in lib/projects.ts,
 * so publishing in the admin revalidates this without a redeploy.
 *
 * Only published projects are ever read (getPublishedProjects), and there is no
 * fallback to another locale: a market shows its own work or says it has none.
 */
export async function ProjectCards({
  block,
  locale,
}: {
  block: Extract<Block, { type: "projectCards" }>;
  locale: string;
}) {
  const projects = await getPublishedProjects(locale);

  return (
    <section className={styles.list}>
      <Container>
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
      </Container>
    </section>
  );
}

export function ProjectCard({
  locale,
  project,
  viewLink,
}: {
  locale: string;
  project: {
    slug: string;
    title: string;
    summary: string | null;
    category: string;
    service: string;
    heroImage: string | null;
    heroImageAlt: string | null;
  };
  viewLink: string;
}) {
  return (
    <Link href={`/${locale}/projects/${project.slug}`} className={styles.card}>
      {project.heroImage && (
        // div, not span: <a> is transparent content, so block elements are legal
        // inside it, but a <span> may not contain the <h2>/<p> below — the parser
        // hoists them out and hydration fails, which silently kills client JS on
        // the whole page (React #418).
        // This is also the clipping frame the image drifts inside; ParallaxImage
        // transforms itself and reads this parent for its geometry.
        <div className={styles.thumb}>
          {/* Plain <img> under the hood: hero images are already AVIF from the
              admin pipeline (lib/upload-project-media.ts), so next/image would
              re-encode finished work and the Supabase host would need
              allowlisting for nothing. */}
          <ParallaxImage src={project.heroImage} alt={project.heroImageAlt ?? ""} />
        </div>
      )}
      <div className={styles.body}>
        <span className={styles.meta}>
          {project.category} · {project.service}
        </span>
        <h2 className={styles.title}>{project.title}</h2>
        {project.summary && <p className={styles.summary}>{project.summary}</p>}
        <span className={styles.link}>{viewLink}</span>
      </div>
    </Link>
  );
}
