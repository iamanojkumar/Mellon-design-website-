import { NextRequest, NextResponse } from "next/server";
import {
  defaultLocale,
  enabledLocaleCodes,
  isEnabledLocale,
  resolveLocaleFromAcceptLanguage,
} from "@/lib/locale";

const LOCALE_COOKIE = "mellon_locale";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const pathnameHasLocale = enabledLocaleCodes.some(
    (locale) =>
      pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (pathnameHasLocale) return NextResponse.next();

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
  const locale =
    cookieLocale && isEnabledLocale(cookieLocale)
      ? cookieLocale
      : resolveLocaleFromAcceptLanguage(
          request.headers.get("accept-language"),
        ) || defaultLocale;

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;

  const response = NextResponse.redirect(url);
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
