import type { ReactNode } from "react";
import { DM_Mono, Roboto_Flex } from "next/font/google";
import { notFound } from "next/navigation";
import {
  enabledLocaleCodes,
  getLocaleConfig,
  isEnabledLocale,
} from "@/lib/locale";
import { SiteBodyStartTags, SiteHeadTags } from "@/components/seo/SiteHeadTags";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { ScrollBlur } from "@/components/motion/ScrollBlur";
import { ImageLiquify } from "@/components/motion/ImageLiquify";
import { NavHoverVars } from "@/components/motion/NavHoverVars";
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

/**
 * Left true (Next's default) so a nested route can still opt into on-demand
 * rendering for its own dynamic segment — app/[locale]/projects/[slug]/page.tsx
 * does this, since case studies publish from /admin and must resolve without a
 * redeploy. Setting this to false here would silently force `fallback: false`
 * for every dynamic segment anywhere under a locale, including that one,
 * regardless of what it declares itself (confirmed via the prerender manifest:
 * https://github.com/vercel/next.js/issues/87738). An invalid locale is still
 * rejected below via isEnabledLocale/notFound(), so this doesn't loosen that.
 */
export const dynamicParams = true;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isEnabledLocale(locale)) notFound();

  // Dev-only motion debugger. The condition is a compile-time constant, so in production
  // the bundler drops the import() and none of the panel code is shipped.
  const DebugPanel =
    process.env.NODE_ENV === "development"
      ? (await import("@/components/debug/DebugPanel")).DebugPanel
      : null;

  const localeConfig = getLocaleConfig(locale)!;

  return (
    <html lang={localeConfig.language} data-market={localeConfig.market}>
      <head>
        <SiteHeadTags />
      </head>
      <body className={`${robotoFlex.variable} ${dmMono.variable}`}>
        <SiteBodyStartTags />
        <SmoothScroll />
        {/* CursorFx (WebGL cursor trail) is switched off site-wide; re-add <CursorFx /> to restore. */}
        <ScrollBlur />
        <ImageLiquify />
        <NavHoverVars />
        {DebugPanel && <DebugPanel />}
        {/* Header, footer and <main> live in the route-group layouts —
            (site) for the marketing pages, (landing-pages) for landing pages. */}
        {children}
      </body>
    </html>
  );
}
