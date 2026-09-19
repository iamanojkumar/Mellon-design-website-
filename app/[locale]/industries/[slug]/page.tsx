import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getIndustries,
  getIndustry,
  getServices,
  getSiteContent,
} from "@/lib/content";
import { enabledLocaleCodes } from "@/lib/locale";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { getSiteUrl } from "@/lib/env";
import { Container } from "@/components/ui/Container";
import { Cta } from "@/components/cta/Cta";
import { JsonLd } from "@/components/seo/JsonLd";
import styles from "./page.module.css";

export function generateStaticParams() {
  return enabledLocaleCodes.flatMap((locale) =>
    getIndustries(locale).map((industry) => ({ locale, slug: industry.slug })),
  );
}

export const dynamicParams = false;

type PageParams = { locale: string; slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const industry = getIndustry(locale, slug);
  if (!industry) return {};
  const site = getSiteContent(locale);
  return buildMetadata({
    locale,
    path: `/industries/${slug}`,
    title: `${industry.name} — ${site.org.name}`,
    description: industry.summary,
  });
}

export default async function IndustryDetailPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { locale, slug } = await params;
  const industry = getIndustry(locale, slug);
  if (!industry) notFound();

  const services = getServices(locale);
  const relatedServices = services.filter((service) =>
    industry.relatedServices.includes(service.slug),
  );
  const localePrefix = `/${locale}`;
  const siteUrl = getSiteUrl();
  const path = `/industries/${slug}`;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd(siteUrl, [
          { name: "Home", path: localePrefix },
          { name: "Industries", path: `${localePrefix}/industries` },
          { name: industry.name, path: `${localePrefix}${path}` },
        ])}
      />

      <section className={styles.hero}>
        <Container>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href={`${localePrefix}/industries`}>Industries</Link>
            <span aria-hidden="true">/</span>
            <span>{industry.name}</span>
          </nav>
          <span className={styles.eyebrow}>{industry.tagline}</span>
          <h1 className={styles.headline}>{industry.name}</h1>
          <p className={styles.summary}>{industry.summary}</p>
          <Cta label="Start a project" href={`${localePrefix}/contact`} context="industry" />
        </Container>
      </section>

      <section className={styles.body}>
        <Container className={styles.bodyGrid}>
          <div>
            <h2 className={styles.blockHeading}>What we deliver</h2>
            <ul className={styles.deliverables}>
              {industry.deliverables.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          {relatedServices.length > 0 && (
            <div>
              <h2 className={styles.blockHeading}>Relevant services</h2>
              <ul className={styles.relatedList}>
                {relatedServices.map((service) => (
                  <li key={service.slug}>
                    <Link href={`${localePrefix}/services/${service.slug}`}>
                      {service.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Container>
      </section>

      <section className={styles.closing}>
        <Container className={styles.closingInner}>
          <h2 className={styles.closingHeadline}>
            Building something in {industry.name.toLowerCase()}?
          </h2>
          <Cta label="Start a project" href={`${localePrefix}/contact`} context="industry" />
        </Container>
      </section>
    </>
  );
}
