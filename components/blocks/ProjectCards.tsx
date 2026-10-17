import type { Block } from "@/lib/blocks";
import { getIndustries, getServices } from "@/lib/content";
import { getPublishedProjects } from "@/lib/projects";
import { Container } from "@/components/ui/Container";
import {
  ProjectsExplorer,
  type ExplorerGroup,
  type ExplorerProject,
} from "./ProjectsExplorer";
import { DEFAULT_GROUPING } from "./project-grouping";
import styles from "./ProjectCards.module.css";

export { ProjectCard } from "./ProjectCard";

/**
 * The full case-study listing, grouped by service or by industry (the visitor
 * toggles). Async because projects come from Supabase, not the content JSON —
 * the fetch is tagged `projects:<locale>` in lib/projects.ts, so publishing in
 * the admin revalidates this without a redeploy.
 *
 * Only published projects are ever read (getPublishedProjects), and there is no
 * fallback to another locale: a market shows its own work or says it has none.
 *
 * Grouping happens here, on the server: a project sits in exactly one service
 * group (its primary `service`) and one industry group (its `category`), so the
 * counts add up to the number of projects. `also_services` is deliberately not
 * used — it feeds "Related work" on the service pages, not this index.
 */
export async function ProjectCards({
  block,
  locale,
}: {
  block: Extract<Block, { type: "projectCards" }>;
  locale: string;
}) {
  const projects = await getPublishedProjects(locale);

  if (projects.length === 0) {
    return (
      <section className={styles.list}>
        <Container>
          <p className={styles.empty}>{block.empty}</p>
        </Container>
      </section>
    );
  }

  const services = getServices(locale);
  const industries = getIndustries(locale);
  const serviceName = new Map(services.map((s) => [s.slug, s.name]));
  const industryName = new Map(industries.map((i) => [i.slug, i.name]));

  const cards: ExplorerProject[] = projects.map((project) => ({
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

  const byService = buildGroups(
    projects.map((p) => ({ id: p.id, key: p.service })),
    services.map((s) => ({ slug: s.slug, name: s.name })),
    (slug) => `/${locale}/services/${slug}`,
  );
  const byIndustry = buildGroups(
    projects.map((p) => ({ id: p.id, key: p.category })),
    industries.map((i) => ({ slug: i.slug, name: i.name })),
    (slug) => `/${locale}/industries/${slug}`,
  );

  return (
    <section className={styles.list}>
      <Container>
        <ProjectsExplorer
          locale={locale}
          projects={cards}
          groups={{ service: byService, industry: byIndustry }}
          viewLink={block.viewLink}
          copy={{ ...DEFAULT_GROUPING, ...block.grouping }}
        />
      </Container>
    </section>
  );
}

/**
 * Buckets project ids by their service/industry slug. Groups follow the order
 * with the most projects first, breaking ties by the registry order (the order
 * the services/industries pages list them in). A slug the registry does not
 * know (a project saved against something since removed) still gets a group so
 * the project is never hidden, labelled by its slug and without a "view all"
 * link because there is no page to send the visitor to.
 */
function buildGroups(
  items: { id: string; key: string }[],
  known: { slug: string; name: string }[],
  hrefFor: (slug: string) => string,
): ExplorerGroup[] {
  const buckets = new Map<string, string[]>();
  for (const { id, key } of items) {
    const ids = buckets.get(key);
    if (ids) ids.push(id);
    else buckets.set(key, [id]);
  }

  const knownSlugs = new Set(known.map((entry) => entry.slug));
  const groups: ExplorerGroup[] = [];

  for (const entry of known) {
    const ids = buckets.get(entry.slug);
    if (ids) groups.push({ slug: entry.slug, label: entry.name, href: hrefFor(entry.slug), ids });
  }
  for (const [slug, ids] of buckets) {
    if (!knownSlugs.has(slug)) groups.push({ slug, label: slug, href: null, ids });
  }

  // Array#sort is stable, so equal counts keep the registry order built above.
  return groups.sort((a, b) => b.ids.length - a.ids.length);
}
