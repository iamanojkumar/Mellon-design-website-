import { getIndustries, getServices, getSiteContent } from "@/lib/content";
import { getPublishedProjects } from "@/lib/projects";
import { getRelatedPicks } from "@/lib/related-work";
import { orderRelated, projectMatchesPage } from "@/lib/related-pick";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/motion/HeroSequence";
import { SwiftUpText } from "@/components/motion/SwiftUpText";
import { RelatedProjectsGrid } from "./RelatedProjectsGrid";
import home from "@/components/blocks/HomeBlocks.module.css";

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
 *
 * Every match is passed to the client grid, which shows three and reveals three
 * more per "Show more" (RelatedProjectsGrid), beside a "View all N projects"
 * button that reveals every match in place (N is this page's matches); neither
 * leaves the page.
 */
export async function RelatedProjects({
  locale,
  service,
  category,
  expandable = true,
}: {
  locale: string;
  /** Service slug this page is about. */
  service?: string;
  /** Industry slug this page is about. */
  category?: string;
  /** Landing pages keep the plain capped list of three, so they stay self-contained. */
  expandable?: boolean;
}) {
  const kind = service ? "service" : "industry";
  const slug = service ?? category;
  if (!slug) return null;

  const [published, picks] = await Promise.all([
    getPublishedProjects(locale),
    getRelatedPicks(locale, kind, slug),
  ]);
  const projects = orderRelated(
    published.map((project) => ({ ...project, auto: projectMatchesPage(project, kind, slug) })),
    picks,
  );
  if (projects.length === 0) return null;

  const copy = getSiteContent(locale).relatedProjects;
  const serviceName = new Map(getServices(locale).map((s) => [s.slug, s.name]));
  const industryName = new Map(getIndustries(locale).map((i) => [i.slug, i.name]));
  const cards = projects.map((project) => ({
    id: project.id,
    slug: project.slug,
    title: project.title,
    summary: project.summary,
    category: project.category,
    service: project.service,
    heroImage: project.heroImage,
    heroImageAlt: project.heroImageAlt,
    meta: `${industryName.get(project.category) ?? project.category} · ${
      serviceName.get(project.service) ?? project.service
    }`,
  }));

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

        <RelatedProjectsGrid
          locale={locale}
          projects={cards}
          viewLink={copy.viewLink}
          showMoreLabel={copy.showMore}
          viewAllTemplate={copy.viewAll}
          expandable={expandable}
        />
      </Container>
    </section>
  );
}
