import { NextRequest, NextResponse } from "next/server";
import {
  defaultLocale,
  enabledLocaleCodes,
  isEnabledLocale,
  resolveLocaleFromAcceptLanguage,
  resolveLocaleFromCountry,
} from "@/lib/locale";
import { getActiveRules, matchRule } from "@/lib/url-rules";

const LOCALE_COOKIE = "mellon_locale";
const COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax",
} as const;

/**
 * URLs from the old WordPress site, which no longer exist. Without this they
 * were redirected to /{locale}/… and 404'd there; answering 410 Gone directly
 * tells Google the removal is deliberate, so they drop out of the index faster
 * than a 404 does. Other paths with a file extension (sitemap.html) bypass the
 * middleware and 404 as before.
 */
const LEGACY_LOCALE_PREFIXES = ["en", "en-us", "en_ca", "sv", "hi"];
const LEGACY_SECTIONS = [
  "category",
  "tag",
  "community",
  "resources",
  "testimonial",
  "work",
  "newsfeed",
  "langs",
  "comments",
  "sample-page",
  "_static",
  "our-approach",
  "dma-intelligence",
  "getreplies",
  "projects/website",
  "projects/app",
];

/**
 * Old WordPress pages that have a direct replacement here. Matched after
 * stripping an optional old language prefix (/en/…, /en-us/…) and any trailing
 * slash, and sent with a permanent redirect so their search signals carry over.
 * Targets are unlocalized; the locale redirect below finishes the job.
 */
const LEGACY_REDIRECTS: Record<string, string> = {
  // Old per-language contact/about pages. Google folded these into /contact as
  // duplicates, so a 301 is more accurate than a 410. The Hindi slug is matched
  // in the percent-encoded form the request carries.
  "/en/contact": "/contact",
  "/en-us/contact": "/contact",
  "/sv/kontakt": "/contact",
  [encodeURI("/hi/संपर्क-करें")]: "/contact",
  "/sv/om-oss": "/about",
  "/about-mellon-design": "/about",
  "/design-agency-contact": "/contact",
  "/industries/non-profit": "/industries/nonprofit-branding",
  "/industries/fashion": "/industries/fashion-brand-design",
  "/industries/health-and-wellness-tech": "/industries/health-wellness-tech",
  "/industries/real-estate": "/industries/real-estate-design",
  "/industries/hospitality": "/industries/hospitality-design",
  "/industries/legal": "/industries/legal-branding",
  "/industries/civil": "/industries/civic-tech-design",
  "/industries/food-beverage": "/industries/restaurant-branding",
};

function legacyRedirectTarget(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  const full = `/${segments.join("/")}`;
  if (LEGACY_REDIRECTS[full]) return LEGACY_REDIRECTS[full];
  if (segments[0] === "en" || segments[0] === "en-us") segments.shift();
  return LEGACY_REDIRECTS[`/${segments.join("/")}`] ?? null;
}

/** 410 with a short human-readable page, for visitors who follow an old link. */
function goneResponse(): NextResponse {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Page removed | Mellon</title><style>:root{color-scheme:light dark}body{margin:0;min-height:100vh;display:grid;place-items:center;font:16px/1.5 system-ui,sans-serif;padding:24px}main{max-width:420px}h1{font:400 28px Georgia,serif;margin:0 0 12px}a{color:inherit}</style></head><body><main><h1>This page has been removed</h1><p>It's no longer part of the Mellon site. You can start again from the <a href="/">homepage</a>, see our <a href="/services">services</a> or <a href="/contact">get in touch</a>.</p></main></body></html>`;
  return new NextResponse(html, {
    status: 410,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

function isLegacyWordPressPath(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return false;
  // Old language prefixes (/en/…, /sv/…, /hi/…, lowercase /en-us/…). The live
  // locales are case-sensitive codes like en-US, so these never collide.
  if (LEGACY_LOCALE_PREFIXES.includes(segments[0])) return true;
  if (segments[0].startsWith("wp-")) return true;
  // WordPress RSS feeds: /feed, /comments/feed, /anything/feed
  if (segments[segments.length - 1] === "feed") return true;
  // Dated blog posts: /2026/06/20/slug/
  if (/^\d{4}$/.test(segments[0]) && /^\d{2}$/.test(segments[1] ?? "")) return true;
  const path = segments.join("/");
  return LEGACY_SECTIONS.some(
    (section) => path === section || path.startsWith(`${section}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const redirectTarget = legacyRedirectTarget(pathname);
  if (redirectTarget) {
    return NextResponse.redirect(new URL(redirectTarget, request.nextUrl), 301);
  }

  if (isLegacyWordPressPath(pathname)) {
    return goneResponse();
  }

  const matchedLocale = enabledLocaleCodes.find(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (matchedLocale) {
    // Remember a locale the visitor actually arrived on. The language switcher
    // is plain links to /{locale}/…, so without this an explicit choice never
    // persisted: picking French then returning to mellon.design bounced them
    // straight back to the guess. Only written when it changes, to avoid
    // resetting the year-long expiry on every request.
    if (request.cookies.get(LOCALE_COOKIE)?.value === matchedLocale) {
      return NextResponse.next();
    }
    const response = NextResponse.next();
    response.cookies.set(LOCALE_COOKIE, matchedLocale, COOKIE_OPTIONS);
    return response;
  }

  // Skip static files, Next internals, and the admin tool (not locale-routed —
  // it has its own internal locale switcher for picking which locale's
  // projects to edit).
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    /\.[^/]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Rules set in /admin/indexing for URLs Search Console reports as 404. Checked
  // only here, on unlocalized paths about to be redirected, so locale-prefixed
  // (live) pages never pay for it.
  if (pathname !== "/") {
    const rule = matchRule(await getActiveRules(), request.nextUrl.hostname, pathname);
    if (rule?.status === "gone") {
      return goneResponse();
    }
    if (rule?.status === "redirect" && rule.redirectTo) {
      const target = new URL(rule.redirectTo, request.nextUrl);
      return NextResponse.redirect(target, 301);
    }
  }

  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  const acceptLanguage = request.headers.get("accept-language");
  // Vercel's geo-IP lookup. Absent locally and on other hosts, where the chain
  // simply falls through to Accept-Language as before.
  const country = request.headers.get("x-vercel-ip-country");

  const locale =
    // 1. What the visitor chose, explicitly, and we remembered.
    (cookieLocale && isEnabledLocale(cookieLocale) ? cookieLocale : null) ??
    // 2. Where they are. Locales here are country-markets, and Accept-Language
    //    cannot answer that: a browser in India sends en-GB or en-US, so
    //    language matching alone can never reach en-IN.
    resolveLocaleFromCountry(country, acceptLanguage) ??
    // 3. What they read, when their country has no market of its own.
    resolveLocaleFromAcceptLanguage(acceptLanguage) ??
    defaultLocale;

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;

  const response = NextResponse.redirect(url);
  response.cookies.set(LOCALE_COOKIE, locale, COOKIE_OPTIONS);
  // This redirect's target now depends on the visitor's IP, so it must never be
  // served from a shared cache to someone in another country.
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  // The second entry lets legacy /wp-login.php, /wp-content/… reach the 410
  // check above; the first skips every other path with a file extension.
  matcher: ["/((?!_next|api|.*\\..*).*)", "/wp-login.php", "/wp-admin/:path*", "/wp-content/:path*", "/wp-includes/:path*", "/wp-json/:path*"],
};
