import { NextRequest, NextResponse } from "next/server";
import {
  defaultLocale,
  enabledLocaleCodes,
  isEnabledLocale,
  resolveLocaleFromAcceptLanguage,
  resolveLocaleFromCountry,
} from "@/lib/locale";

const LOCALE_COOKIE = "mellon_locale";
const COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax",
} as const;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
