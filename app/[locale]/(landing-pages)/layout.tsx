import type { ReactNode } from "react";
import { getSiteContent } from "@/lib/content";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";

/**
 * Chrome for landing pages: its own minimal header and footer instead of the
 * site's. Nothing on the marketing site links here — these pages are reached
 * from search results (and campaigns) only.
 */
export default async function LandingLayout({
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
      {/* Every landing page puts its lead form in a section with id="quote". */}
      <LandingHeader cta={{ label: site.nav.cta.label, href: "#quote" }} />
      <main id="main">{children}</main>
      <LandingFooter locale={locale} footer={site.footer} org={site.org} />
    </>
  );
}
