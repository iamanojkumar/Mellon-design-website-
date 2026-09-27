import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getSiteContent } from "@/lib/content";
import { enabledLocaleCodes } from "@/lib/locale";
import {
  getProject,
  getProjectByPreviousSlug,
  getPublishedProjects,
  type Project,
} from "@/lib/projects";
import { buildProjectJsonLd, resolveSeo } from "@/lib/project-seo";
import { breadcrumbJsonLd, buildMetadata, ogTypeForSchema } from "@/lib/seo";
import { getSiteUrl } from "@/lib/env";
import { Container } from "@/components/ui/Container";
import { JsonLd } from "@/components/seo/JsonLd";
import { ProjectBlocks } from "@/components/projects/ProjectBlocks";
import styles from "./page.module.css";

/**
 * Case studies live in Supabase and are published from /admin, so unlike every
 * other route here this one keeps dynamicParams on: a project published a
 * minute ago must resolve without a redeploy. generateStaticParams still
 * prerenders everything live at build time, and the admin's revalidateTag
 * keeps those pages current.
 */
export async function generateStaticParams() {
  const perLocale = await Promise.all(
    enabledLocaleCodes.map(async (locale) => {
      const projects = await getPublishedProjects(locale);
      return projects.map((project) => ({ locale, slug: project.slug }));
    }),
  );
  return perLocale.flat();
}

export const dynamicParams = true;

/** Same safety net as the listing — see app/[locale]/projects/page.tsx. */
export const revalidate = 300;

type PageParams = { locale: string; slug: string };

/** Only published projects are public; drafts 404 exactly like a bad slug. */
async function findPublished(locale: string, slug: string): Promise<Project | undefined> {
  const project = await getProject(locale, slug);
  return project && project.status === "published" ? project : undefined;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const project = await findPublished(locale, slug);
  if (!project) return {};

  const seo = resolveSeo(project);
  return buildMetadata({
    locale,
    path: `/projects/${slug}`,
    title: seo.metaTitle,
    description: seo.metaDescription,
    ogImage: seo.ogImage,
    ogType: ogTypeForSchema(project.schemaType),
    // A real hero earns the large card; without one the summary card is honest.
    twitterCard: project.heroImage ? "summary_large_image" : "summary",
    noindex: project.noindex,
    canonicalOverride: project.canonicalUrl ?? undefined,
  });
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { locale, slug } = await params;
  const project = await findPublished(locale, slug);

  if (!project) {
    // The slug may be one this project used to answer to — the admin keeps that
    // history in previous_slugs, so a rename 301s instead of breaking the URL.
    const renamed = await getProjectByPreviousSlug(locale, slug);
    if (renamed && renamed.status === "published") {
      permanentRedirect(`/${locale}/projects/${renamed.slug}`);
    }
    notFound();
  }

  const site = getSiteContent(locale);
  const label = site.projectsPage.label;
  const siteUrl = getSiteUrl();
  const localePrefix = `/${locale}`;
  const canonical = project.canonicalUrl || `${siteUrl}${localePrefix}/projects/${project.slug}`;

  return (
    <>
      <JsonLd data={buildProjectJsonLd(siteUrl, locale, canonical, project)} />
      <JsonLd
        data={breadcrumbJsonLd(siteUrl, [
          { name: site.common.home, path: localePrefix },
          { name: label, path: `${localePrefix}/projects` },
          { name: project.title, path: `${localePrefix}/projects/${project.slug}` },
        ])}
      />

      <article className={styles.article}>
        <Container>
          {/* customHead renders here rather than in <head>: App Router builds
              the head from generateMetadata, and arbitrary markup cannot be
              injected into it. <style> and <script> are valid in body and
              behave identically; meta/link belong in the SEO fields above,
              which do reach the head. */}
          {project.customHead && (
            <div hidden dangerouslySetInnerHTML={{ __html: project.customHead }} />
          )}
          <p className={styles.meta}>
            {project.category} · {project.service}
          </p>
          <h1 className={styles.title}>{project.title}</h1>
          {project.summary && <p className={styles.summary}>{project.summary}</p>}

          {project.heroImage && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              className={styles.hero}
              src={project.heroImage}
              alt={project.heroImageAlt ?? ""}
              width={project.heroImageWidth ?? undefined}
              height={project.heroImageHeight ?? undefined}
              // The hero is the LCP element, so it must not be lazy.
              fetchPriority="high"
              decoding="async"
            />
          )}

          {project.content && (
            // Authored in the admin's rich-text editor, which is behind a
            // password and writes its own markup — the same trust boundary as
            // the customHead/customBody fields below.
            <div
              className={styles.body}
              dangerouslySetInnerHTML={{ __html: project.content }}
            />
          )}

          <ProjectBlocks blocks={project.blocks} />

          <p className={styles.back}>
            <Link href={`${localePrefix}/projects`}>← {label}</Link>
          </p>
        </Container>
      </article>

      {project.customBody && (
        <div dangerouslySetInnerHTML={{ __html: project.customBody }} />
      )}
    </>
  );
}
