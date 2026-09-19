import type { ReactNode } from "react";
import { DM_Mono, Roboto_Flex } from "next/font/google";
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

const robotoFlex = Roboto_Flex({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
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
      <body className={`${robotoFlex.variable} ${dmMono.variable}`}>
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
