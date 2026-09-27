import Link from "next/link";
import type { Block } from "@/lib/blocks";
import { getPublishedProjects } from "@/lib/projects";
import { Container } from "@/components/ui/Container";
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
        <span className={styles.thumb}>
          {/* Plain <img>: hero images are already AVIF from the admin pipeline
              (lib/upload-project-media.ts), so next/image would re-encode work
              that is done, and the Supabase host would need allowlisting. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.heroImage}
            alt={project.heroImageAlt ?? ""}
            loading="lazy"
            decoding="async"
          />
        </span>
      )}
      <span className={styles.body}>
        <span className={styles.meta}>
          {project.category} · {project.service}
        </span>
        <h2 className={styles.title}>{project.title}</h2>
        {project.summary && <p className={styles.summary}>{project.summary}</p>}
        <span className={styles.link}>{viewLink}</span>
      </span>
    </Link>
  );
}
