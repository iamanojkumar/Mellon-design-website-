/**
 * URL rules: what to answer for old URLs that Search Console reports as 404.
 * Edge-safe (no Node APIs, no server-only) because middleware.ts imports it.
 * The admin tool that edits the rules is app/admin/(panel)/indexing; storage is
 * lib/url-rules-store.ts.
 */

import { enabledLocaleCodes } from "@/lib/locale";
import { landingPages } from "@/lib/landing-pages";

export type UrlRuleStatus = "pending" | "gone" | "redirect" | "ignored";

/** A rule the middleware enforces. */
export type ActiveRule = {
  host: string;
  path: string;
  status: "gone" | "redirect";
  redirectTo: string | null;
};

/** First path segments that belong to the live site. Never rule-able. */
const LIVE_SEGMENTS = new Set([
  "about",
  "contact",
  "services",
  "industries",
  "projects",
  "privacy",
  "admin",
  "api",
  ...landingPages.map((page) => page.slug),
]);

export function normalizeHost(host: string): string {
  return host.toLowerCase().replace(/^www\./, "");
}

/**
 * Turns a URL (or a bare path) into the key rules are stored under: host, plus
 * the path with no query string, fragment or trailing slash. A trailing `/*`
 * is kept as a prefix marker. Returns null for anything that isn't a URL.
 */
export function parseRuleUrl(raw: string): { host: string; path: string } | null {
  const value = raw.trim();
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value.startsWith("/") ? `https://placeholder.invalid${value}` : value);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname;
  return { host: normalizeHost(url.hostname), path: path || "/" };
}

/**
 * Whether a path is (or could be) a live page, so a 410 or redirect would break
 * it. Unlocalized live paths like /about are redirected to /{locale}/about by
 * middleware, so they are only "not found" in Search Console by accident.
 */
export function isProtectedPath(path: string): boolean {
  const first = path.split("/").filter(Boolean)[0];
  if (!first) return true;
  return enabledLocaleCodes.includes(first) || LIVE_SEGMENTS.has(first);
}

export function matchRule(rules: ActiveRule[], host: string, pathname: string): ActiveRule | null {
  const requestHost = normalizeHost(host);
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  for (const rule of rules) {
    if (rule.host !== requestHost) continue;
    if (rule.path.endsWith("/*")) {
      const base = rule.path.slice(0, -2);
      if (path === base || path.startsWith(`${base}/`)) return rule;
    } else if (rule.path === path) {
      return rule;
    }
  }
  return null;
}

// Middleware runs per request on many instances, so the rule list is cached in
// memory and refreshed at most once a minute: an admin change takes up to that
// long to apply. A failed fetch keeps the previous list rather than blocking
// the request.
const CACHE_TTL_MS = 60_000;
let cache: { at: number; rules: ActiveRule[] } | null = null;

export async function getActiveRules(): Promise<ActiveRule[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.rules;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return cache?.rules ?? [];

  try {
    const response = await fetch(
      `${url}/rest/v1/url_rules?select=host,path,status,redirect_to&status=in.(gone,redirect)`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        cache: "no-store",
        signal: AbortSignal.timeout(1500),
      },
    );
    if (!response.ok) throw new Error(`url_rules fetch failed: ${response.status}`);
    const rows = (await response.json()) as {
      host: string;
      path: string;
      status: "gone" | "redirect";
      redirect_to: string | null;
    }[];
    cache = {
      at: Date.now(),
      rules: rows.map((row) => ({
        host: normalizeHost(row.host),
        path: row.path,
        status: row.status,
        redirectTo: row.redirect_to,
      })),
    };
  } catch (error) {
    console.error("[url-rules] could not load rules", error);
    // Back off for the full TTL instead of retrying on every request.
    cache = { at: Date.now(), rules: cache?.rules ?? [] };
  }
  return cache.rules;
}
