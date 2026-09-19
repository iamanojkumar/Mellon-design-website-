import type { ReactNode } from "react";
import { Fraunces, Inter } from "next/font/google";
import { notFound } from "next/navigation";
import {
  enabledLocaleCodes,
  getLocaleConfig,
  isEnabledLocale,
} from "@/lib/locale";
import { getSiteContent } from "@/lib/content";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "@/styles/globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export function generateStaticParams() {
  return enabledLocaleCodes.map((locale) => ({ locale }));
}

export const dynamicParams = false;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isEnabledLocale(locale)) notFound();

  const localeConfig = getLocaleConfig(locale)!;
  const site = getSiteContent(locale);

  return (
    <html lang={localeConfig.language} data-market={localeConfig.market}>
      <body className={`${fraunces.variable} ${inter.variable}`}>
        <a href="#main" className="visually-hidden">
          Skip to content
        </a>
        <Header locale={locale} nav={site.nav.primary} cta={site.nav.cta} />
        <main id="main">{children}</main>
        <Footer locale={locale} footer={site.footer} org={site.org} />
      </body>
    </html>
  );
}
