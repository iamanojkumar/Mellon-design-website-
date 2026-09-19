import type { Metadata } from "next";
import { getSiteContent } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";
import { Container } from "@/components/ui/Container";
import { ContactForm } from "@/components/contact-form/ContactForm";
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
    path: "/contact",
    title: `Contact — ${site.org.name}`,
    description: site.contact.hero.subhead,
  });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const site = getSiteContent(locale);

  return (
    <section className={styles.section}>
      <Container className={styles.grid}>
        <div className={styles.intro}>
          <span className={styles.eyebrow}>{site.contact.hero.eyebrow}</span>
          <h1 className={styles.headline}>{site.contact.hero.headline}</h1>
          <p className={styles.subhead}>{site.contact.hero.subhead}</p>
          <p className={styles.direct}>
            {site.contact.directEmailLabel}{" "}
            <a href={`mailto:${site.org.email}`}>{site.org.email}</a>
          </p>
        </div>

        <div className={styles.formWrap}>
          <ContactForm
            successMessage={site.contact.form.successMessage}
            submitLabel={site.contact.form.submitLabel}
          />
        </div>
      </Container>
    </section>
  );
}
