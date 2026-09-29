import type { ReactNode } from "react";
import { getSiteContent } from "@/lib/content";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

/**
 * Chrome for the marketing site. The route group adds nothing to the URL; it
 * exists so landing pages ((landing-pages) next door) can have a different
 * header and footer under the same locale layout.
 */
export default async function SiteLayout({
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
      <Header locale={locale} nav={site.nav.primary} cta={site.nav.cta} common={site.common} />
      <main id="main">{children}</main>
      <Footer locale={locale} footer={site.footer} org={site.org} />
    </>
  );
}
