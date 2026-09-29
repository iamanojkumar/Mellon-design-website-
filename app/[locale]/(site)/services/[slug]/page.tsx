import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getIndustries,
  getService,
  getServices,
  getSiteContent,
} from "@/lib/content";
import { enabledLocaleCodes } from "@/lib/locale";
import { breadcrumbJsonLd, buildMetadata, serviceJsonLd } from "@/lib/seo";
import { getSiteUrl } from "@/lib/env";
import { Container } from "@/components/ui/Container";
import { Cta } from "@/components/cta/Cta";
import { JsonLd } from "@/components/seo/JsonLd";
import styles from "./page.module.css";

export function generateStaticParams() {
  return enabledLocaleCodes.flatMap((locale) =>
    getServices(locale).map((service) => ({ locale, slug: service.slug })),
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
  const service = getService(locale, slug);
  if (!service) return {};
  const site = getSiteContent(locale);
  return buildMetadata({
    locale,
    path: `/services/${slug}`,
    title: `${service.name} — ${site.org.name}`,
    description: service.summary,
  });
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { locale, slug } = await params;
  const service = getService(locale, slug);
  if (!service) notFound();

  const site = getSiteContent(locale);
  const page = site.servicesPage;
  const industries = getIndustries(locale);
  const relatedIndustries = industries.filter((industry) =>
    service.relatedIndustries.includes(industry.slug),
  );
  const localePrefix = `/${locale}`;
  const siteUrl = getSiteUrl();
  const path = `/services/${slug}`;

  return (
    <>
      <JsonLd data={serviceJsonLd(siteUrl, service, `${localePrefix}${path}`)} />
      <JsonLd
        data={breadcrumbJsonLd(siteUrl, [
          { name: site.common.home, path: localePrefix },
          { name: page.label, path: `${localePrefix}/services` },
          { name: service.name, path: `${localePrefix}${path}` },
        ])}
      />

      <section className={styles.hero}>
        <Container>
          <nav className={styles.breadcrumb} aria-label={site.common.breadcrumbAria}>
            <Link href={`${localePrefix}/services`}>{page.label}</Link>
            <span aria-hidden="true">/</span>
            <span>{service.name}</span>
          </nav>
          <span className={styles.eyebrow}>{service.tagline}</span>
          <h1 className={styles.headline}>{service.name}</h1>
          <p className={styles.summary}>{service.summary}</p>
          <Cta label={site.common.startProject} href={`${localePrefix}/contact`} context="service" />
        </Container>
      </section>

      <section className={styles.body}>
        <Container className={styles.bodyGrid}>
          <div>
            <h2 className={styles.blockHeading}>{page.detail.included}</h2>
            <ul className={styles.deliverables}>
              {service.deliverables.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          {relatedIndustries.length > 0 && (
            <div>
              <h2 className={styles.blockHeading}>{page.detail.usedIn}</h2>
              <ul className={styles.relatedList}>
                {relatedIndustries.map((industry) => (
                  <li key={industry.slug}>
                    <Link href={`${localePrefix}/industries/${industry.slug}`}>
                      {industry.name}
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
            {page.detail.readyHeadline.replace("{nameLower}", service.name.toLocaleLowerCase(locale)).replace("{name}", service.name)}
          </h2>
          <Cta label={site.common.startProject} href={`${localePrefix}/contact`} context="service" />
        </Container>
      </section>
    </>
  );
}
