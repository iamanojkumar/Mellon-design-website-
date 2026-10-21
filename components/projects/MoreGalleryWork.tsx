import { getServices, getSiteContent } from "@/lib/content";
import { getPublishedProjects, type Project } from "@/lib/projects";
import { projectImages } from "@/lib/project-gallery";
import { projectMatchesPage } from "@/lib/related-pick";
import { Container } from "@/components/ui/Container";
import { RevealGroup } from "@/components/motion/RevealGroup";
import { SwiftUpText } from "@/components/motion/SwiftUpText";
import { MasonryCard } from "./MasonryCard";
import masonry from "./Masonry.module.css";
import styles from "./MoreGalleryWork.module.css";

/** Enough for a few rows of the wall without turning the page into the index. */
const LIMIT = 12;

/**
 * "More graphic design work" under an image-only project: other published work
 * of the same service (or listing it under "also relevant to"), as the same
 * masonry wall the index uses. Match-only like Related work; with nothing to
 * show the section is not rendered.
 */
export async function MoreGalleryWork({ locale, project }: { locale: string; project: Project }) {
  const published = await getPublishedProjects(locale);
  const matches = published
    .filter((other) => other.id !== project.id && projectMatchesPage(other, "service", project.service))
    .slice(0, LIMIT);
  if (matches.length === 0) return null;

  const site = getSiteContent(locale);
  const serviceName = getServices(locale).find((service) => service.slug === project.service)?.name ?? project.service;
  const heading = site.projectsPage.gallery.more.replace("{service}", serviceName);

  return (
    <section className={styles.section}>
      <Container>
        <h2 className={styles.heading}>
          <SwiftUpText text={heading} whenVisible />
        </h2>
        <RevealGroup className={masonry.wall}>
          {matches.map((match) => (
            <MasonryCard
              key={match.id}
              locale={locale}
              project={{ slug: match.slug, title: match.title, images: projectImages(match) }}
              labels={site.projectsPage.gallery}
            />
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
