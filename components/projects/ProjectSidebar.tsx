import Link from "next/link";
import { getIndustries, getServices, getSiteContent } from "@/lib/content";
import { getPublishedProjects, type Project } from "@/lib/projects";
import { FadeIn } from "@/components/motion/HeroSequence";
import { RevealGroup } from "@/components/motion/RevealGroup";
import styles from "./ProjectSidebar.module.css";

/** Two rows per widget: the sidebar points onward, it isn't a second listing. */
const WIDGET_LIMIT = 2;

export type ProjectSidebarData = {
  services: { slug: string; name: string; tagline: string }[];
  projects: Pick<Project, "id" | "slug" | "title" | "heroImage" | "heroImageAlt">[];
  industryName: string | null;
  /** False when the widget has nothing to show; the widget is then not rendered. */
  showServices: boolean;
  showProjects: boolean;
};

/**
 * What the case study's sidebar would show. Match-only, like "Related work"
 * elsewhere (lib/related-pick.ts): services are the project's own service and
 * its "also relevant to" list; projects share its industry. Nothing unrelated
 * is used as filler, so either widget can be empty, and the page drops the
 * whole sidebar when both are.
 */
export async function getProjectSidebarData(locale: string, project: Project): Promise<ProjectSidebarData> {
  const serviceBySlug = new Map(getServices(locale).map((service) => [service.slug, service]));
  const services = [project.service, ...project.alsoServices]
    .filter((slug, i, all) => slug && all.indexOf(slug) === i)
    .map((slug) => serviceBySlug.get(slug))
    .filter((service) => !!service)
    .slice(0, WIDGET_LIMIT)
    .map(({ slug, name, tagline }) => ({ slug, name, tagline }));

  let projects: ProjectSidebarData["projects"] = [];
  if (project.category) {
    try {
      projects = (await getPublishedProjects(locale))
        .filter((other) => other.id !== project.id && other.category === project.category)
        .slice(0, WIDGET_LIMIT);
    } catch (error) {
      // The case study itself loaded; a failed side fetch just hides the widget.
      console.error("[projects] sidebar: could not list related projects", error);
    }
  }

  const industryName = getIndustries(locale).find((industry) => industry.slug === project.category)?.name ?? null;

  return {
    services,
    projects,
    industryName,
    showServices: services.length > 0,
    showProjects: projects.length > 0,
  };
}

export function ProjectSidebar({ locale, data }: { locale: string; data: ProjectSidebarData }) {
  if (!data.showServices && !data.showProjects) return null;
  const copy = getSiteContent(locale).projectsPage.sidebar;

  return (
    <aside className={styles.sidebar} aria-label={copy.label}>
      {data.showServices && (
        <section className={styles.widget}>
          <FadeIn as="span" whenVisible className={styles.eyebrow}>
            {copy.servicesEyebrow}
          </FadeIn>
          <h2 className={styles.heading}>{copy.servicesHeading}</h2>
          <RevealGroup as="ul" className={styles.list}>
            {data.services.map((service) => (
              <li key={service.slug}>
                <Link href={`/${locale}/services/${service.slug}`} className={styles.serviceRow}>
                  <span className={styles.rowTitle}>{service.name}</span>
                  <span className={styles.rowText}>{service.tagline}</span>
                  <span className={styles.arrow} aria-hidden="true">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </RevealGroup>
        </section>
      )}

      {data.showProjects && (
        <section className={styles.widget}>
          <FadeIn as="span" whenVisible className={styles.eyebrow}>
            {data.industryName ?? copy.projectsEyebrow}
          </FadeIn>
          <h2 className={styles.heading}>{copy.projectsHeading}</h2>
          <RevealGroup as="ul" className={styles.list}>
            {data.projects.map((project) => (
              <li key={project.id}>
                <Link href={`/${locale}/projects/${project.slug}`} className={styles.projectRow}>
                  {project.heroImage && (
                    // Already AVIF from the admin pipeline, so a plain <img> (see ProjectCards).
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={project.heroImage}
                      alt=""
                      className={styles.thumb}
                      loading="lazy"
                      // Decorative: the title next to it names the link.
                      decoding="async"
                    />
                  )}
                  <span className={styles.rowTitle}>{project.title}</span>
                </Link>
              </li>
            ))}
          </RevealGroup>
        </section>
      )}
    </aside>
  );
}
