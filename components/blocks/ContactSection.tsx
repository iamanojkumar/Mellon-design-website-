import type { Block } from "@/lib/blocks";
import { getSiteContent } from "@/lib/content";
import { ContactAssistant } from "@/components/assistant/ContactAssistant";
import { isCompanyPagePublished } from "@/lib/company-pages";
import styles from "./ContactSection.module.css";

export function ContactSection({
  block,
  locale,
}: {
  block: Extract<Block, { type: "contact" }>;
  locale: string;
}) {
  const site = getSiteContent(locale);
  const form = site.forms.contact;
  return (
    <section className={styles.section}>
      {/* Full-bleed: no Container, so the chat runs edge to edge. */}
      {/* The assistant is the default way in; it hands over a filled-in form,
          and the visitor can switch to the plain form at any point. */}
      <ContactAssistant
        locale={locale}
        copy={site.assistant}
        form={form}
        aiPolicyHref={isCompanyPagePublished(locale, "ai") ? `/${locale}/about/ai` : null}
        directEmail={{ label: block.directEmailLabel, address: site.org.email }}
        heading={block.headline}
        subheading={block.subhead}
      />
    </section>
  );
}
