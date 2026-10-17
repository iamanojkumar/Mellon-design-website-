import Link from "next/link";
import { ParallaxImage } from "@/components/motion/ParallaxImage";
import styles from "./ProjectCards.module.css";

/**
 * One case-study card. Lives in its own file, free of server-only imports, so
 * the client-side grouped listing (ProjectsExplorer) can render it as well as
 * the server-rendered home teaser.
 *
 * `meta` is the line above the title (e.g. "Fashion · Web design"). Callers that
 * have the display names pass them; without it the raw slugs are shown.
 */
export function ProjectCard({
  locale,
  project,
  viewLink,
  meta,
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
  meta?: string;
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
        <span className={styles.meta}>{meta ?? `${project.category} · ${project.service}`}</span>
        <h3 className={styles.title}>{project.title}</h3>
        {project.summary && <p className={styles.summary}>{project.summary}</p>}
        <span className={styles.link}>{viewLink}</span>
      </div>
    </Link>
  );
}
