import "server-only";
import { parseRuleUrl, type UrlRuleStatus } from "@/lib/url-rules";

/** Admin-side storage for url_rules (see supabase/migrations/…_url_rules.sql). */

export type UrlRule = {
  id: string;
  host: string;
  path: string;
  originalUrl: string;
  lastCrawled: string | null;
  status: UrlRuleStatus;
  redirectTo: string | null;
};

type Row = {
  id: string;
  host: string;
  path: string;
  original_url: string;
  last_crawled: string | null;
  status: UrlRuleStatus;
  redirect_to: string | null;
};

function endpoint(query = ""): { url: string; headers: Record<string, string> } {
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set");
  return {
    url: `${base}/rest/v1/url_rules${query}`,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  };
}

function toRule(row: Row): UrlRule {
  return {
    id: row.id,
    host: row.host,
    path: row.path,
    originalUrl: row.original_url,
    lastCrawled: row.last_crawled,
    status: row.status,
    redirectTo: row.redirect_to,
  };
}

async function check(response: Response, what: string) {
  if (!response.ok) throw new Error(`${what} failed: ${response.status} ${await response.text()}`);
}

export async function listUrlRules(): Promise<UrlRule[]> {
  const { url, headers } = endpoint("?select=*&order=last_crawled.desc.nullslast,path.asc");
  const response = await fetch(url, { headers, cache: "no-store" });
  await check(response, "List url_rules");
  return ((await response.json()) as Row[]).map(toRule);
}

export type CsvEntry = { url: string; lastCrawled: string | null };

/**
 * Adds CSV rows as `pending`. Rows whose host+path already exist are left
 * alone, so re-importing a fresh export never undoes a decision. Several URLs
 * that differ only by query string collapse to one row (latest crawl date).
 */
export async function importUrlRules(entries: CsvEntry[]): Promise<{ added: number; skipped: number }> {
  const byKey = new Map<string, Row>();
  let invalid = 0;
  for (const entry of entries) {
    const parsed = parseRuleUrl(entry.url);
    if (!parsed) {
      invalid += 1;
      continue;
    }
    const key = `${parsed.host}${parsed.path}`;
    const crawled = entry.lastCrawled && /^\d{4}-\d{2}-\d{2}$/.test(entry.lastCrawled) ? entry.lastCrawled : null;
    const existing = byKey.get(key);
    if (existing) {
      if (crawled && (!existing.last_crawled || crawled > existing.last_crawled)) {
        existing.last_crawled = crawled;
      }
      continue;
    }
    byKey.set(key, {
      id: "",
      host: parsed.host,
      path: parsed.path,
      original_url: entry.url.trim(),
      last_crawled: crawled,
      status: "pending",
      redirect_to: null,
    });
  }

  const rows = [...byKey.values()].map(({ id: _id, ...rest }) => rest);
  if (rows.length === 0) return { added: 0, skipped: invalid };

  const { url, headers } = endpoint("?on_conflict=host,path");
  const response = await fetch(url, {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=ignore-duplicates,return=representation" },
    body: JSON.stringify(rows),
    cache: "no-store",
  });
  await check(response, "Import url_rules");
  const inserted = ((await response.json()) as unknown[]).length;
  return { added: inserted, skipped: invalid + (rows.length - inserted) };
}

export async function setUrlRuleStatus(
  ids: string[],
  status: UrlRuleStatus,
  redirectTo: string | null,
): Promise<void> {
  if (ids.length === 0) return;
  const { url, headers } = endpoint(`?id=in.(${ids.join(",")})`);
  const response = await fetch(url, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify({
      status,
      redirect_to: status === "redirect" ? redirectTo : null,
      updated_at: new Date().toISOString(),
    }),
    cache: "no-store",
  });
  await check(response, "Update url_rules");
}

export async function deleteUrlRules(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { url, headers } = endpoint(`?id=in.(${ids.join(",")})`);
  const response = await fetch(url, { method: "DELETE", headers, cache: "no-store" });
  await check(response, "Delete url_rules");
}
