import type { ReactNode } from "react";
import { getSiteContent } from "@/lib/content";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";

/**
 * Chrome for legal pages (privacy, and any future terms/cookies). The marketing
 * site and landing pages both link here, but a legal page links to nothing
 * else: it reuses the landing chrome — non-link logo, no nav, legal links and
 * consent trigger only — so a visitor can read it without being drawn into
 * the site. The route group adds nothing to the URL.
 */
export default async function LegalLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const site = getSiteContent(locale);

  return (
    <>
      <a href="#main" className="visually-hidden">
        {site.common.skipToContent}
      </a>
      <LandingHeader />
      <main id="main">{children}</main>
      <LandingFooter locale={locale} footer={site.footer} org={site.org} />
    </>
  );
}
