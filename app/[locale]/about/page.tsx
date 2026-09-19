import type { Metadata } from "next";
import { getSiteContent } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { Container } from "@/components/ui/Container";
import { Cta } from "@/components/cta/Cta";
import styles from "./page.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const site = getSiteContent(locale);
  return buildMetadata({
    locale,
    path: "/about",
    title: `About — ${site.org.name}`,
    description: site.about.hero.subhead,
  });
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const site = getSiteContent(locale);
  const localePrefix = `/${locale}`;

  return (
    <>
      <section className={styles.hero}>
        <Container>
          <span className={styles.eyebrow}>{site.about.hero.eyebrow}</span>
          <h1 className={styles.headline}>{site.about.hero.headline}</h1>
          <p className={styles.subhead}>{site.about.hero.subhead}</p>
        </Container>
      </section>

      <section className={styles.body}>
        <Container>
          <div className={styles.sections}>
            {site.about.sections.map((section) => (
              <div key={section.heading} className={styles.block}>
                <h2 className={styles.blockHeading}>{section.heading}</h2>
                <p className={styles.blockBody}>{section.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className={styles.closing}>
        <Container className={styles.closingInner}>
          <h2 className={styles.closingHeadline}>Start with a conversation.</h2>
          <Cta label="Start a project" href={`${localePrefix}/contact`} context="about" />
        </Container>
      </section>
    </>
  );
}
