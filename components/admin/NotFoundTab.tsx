"use client";

import { useMemo, useState, useTransition, type ChangeEvent } from "react";
import { applyUrlRuleAction, importUrlsAction, type UrlRuleAction } from "@/app/admin/indexing-actions";
import type { UrlRule } from "@/lib/url-rules-store";
import { isProtectedPath, type UrlRuleStatus } from "@/lib/url-rules";
import { parseCsv } from "./csv";
import styles from "./NotFoundTab.module.css";

type Filter = "all" | UrlRuleStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "pending", label: "To do" },
  { id: "gone", label: "410 Gone" },
  { id: "redirect", label: "Redirected" },
  { id: "ignored", label: "Ignored" },
  { id: "all", label: "All" },
];

const STATUS_LABEL: Record<UrlRuleStatus, string> = {
  pending: "To do",
  gone: "410 Gone",
  redirect: "301 Redirect",
  ignored: "Ignored",
};

export function NotFoundTab({
  initialRules,
  initialError,
}: {
  initialRules: UrlRule[];
  initialError: string | null;
}) {
  const [rules, setRules] = useState(initialRules);
  const [filter, setFilter] = useState<Filter>("pending");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [redirectTo, setRedirectTo] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(initialError);
  const [isPending, startTransition] = useTransition();

  const counts = useMemo(() => {
    const result: Record<Filter, number> = { all: rules.length, pending: 0, gone: 0, redirect: 0, ignored: 0 };
    for (const rule of rules) result[rule.status] += 1;
    return result;
  }, [rules]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rules.filter(
      (rule) =>
        (filter === "all" || rule.status === filter) &&
        (!needle || `${rule.host}${rule.path}`.toLowerCase().includes(needle)),
    );
  }, [rules, filter, query]);

  // "Select all" means everything currently shown, not rows hidden by a filter.
  const allVisibleSelected = visible.length > 0 && visible.every((rule) => selected.has(rule.id));
  const selectedIds = visible.filter((rule) => selected.has(rule.id)).map((rule) => rule.id);

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected(allVisibleSelected ? new Set() : new Set(visible.map((rule) => rule.id)));

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    setMessage(null);

    const rows = parseCsv(await file.text());
    const header = rows[0]?.map((cell) => cell.trim().toLowerCase()) ?? [];
    const hasHeader = header.includes("url") || header.includes("page");
    const urlColumn = Math.max(header.findIndex((cell) => cell === "url" || cell === "page"), 0);
    const crawledColumn = header.findIndex((cell) => cell.includes("crawled"));
    const entries = rows
      .slice(hasHeader ? 1 : 0)
      .map((row) => ({
        url: row[urlColumn] ?? "",
        lastCrawled: crawledColumn >= 0 ? row[crawledColumn]?.trim() || null : null,
      }))
      .filter((entry) => entry.url.trim());

    startTransition(async () => {
      const result = await importUrlsAction(entries);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setRules(result.data.rules);
      setSelected(new Set());
      setFilter("pending");
      setMessage(
        `${result.data.added} new URL${result.data.added === 1 ? "" : "s"} added; ` +
          `${result.data.skipped} skipped (already listed, duplicate or invalid).`,
      );
    });
  };

  const apply = (action: UrlRuleAction) => {
    if (selectedIds.length === 0) return;
    if (action.type === "delete" && !window.confirm(`Remove ${selectedIds.length} URL(s) from the list?`)) return;
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await applyUrlRuleAction(selectedIds, action);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setRules(result.data);
      setSelected(new Set());
      setMessage(
        action.type === "delete"
          ? "Removed."
          : "Saved. Live within about a minute (middleware caches the list).",
      );
    });
  };

  const none = selectedIds.length === 0 || isPending;

  return (
    <div className={styles.wrap}>
      <section className={styles.upload}>
        <label className="a-btn a-btn-primary">
          Upload CSV
          <input type="file" accept=".csv,text/csv" onChange={onFile} hidden disabled={isPending} />
        </label>
        <span className="a-hint">
          Search Console → Pages → Not found (404) → Export → CSV. Re-uploading never undoes a decision already made.
        </span>
      </section>

      {error && <p className="a-error">{error}</p>}
      {message && <p className="a-hint">{message}</p>}

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={styles.filter}
              aria-pressed={filter === item.id}
              onClick={() => {
                setFilter(item.id);
                setSelected(new Set());
              }}
            >
              {item.label} ({counts[item.id]})
            </button>
          ))}
        </div>
        <input
          className="a-input"
          style={{ maxWidth: 260 }}
          type="search"
          placeholder="Filter by URL…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className={styles.actions}>
        <span className="a-hint">{selectedIds.length} selected</span>
        <button type="button" className="a-btn a-btn-primary" disabled={none} onClick={() => apply({ type: "gone" })}>
          Set 410 Gone
        </button>
        <input
          className="a-input"
          style={{ maxWidth: 200 }}
          placeholder="/new-path or https://…"
          value={redirectTo}
          onChange={(event) => setRedirectTo(event.target.value)}
        />
        <button
          type="button"
          className="a-btn"
          disabled={none || !redirectTo.trim()}
          onClick={() => apply({ type: "redirect", to: redirectTo })}
        >
          301 Redirect
        </button>
        <button type="button" className="a-btn" disabled={none} onClick={() => apply({ type: "ignored" })}>
          Ignore (leave 404)
        </button>
        <button type="button" className="a-btn" disabled={none} onClick={() => apply({ type: "pending" })}>
          Reset to To do
        </button>
        <button type="button" className="a-btn a-btn-danger" disabled={none} onClick={() => apply({ type: "delete" })}>
          Remove from list
        </button>
      </div>

      {visible.length === 0 ? (
        <p className="a-hint">
          {rules.length === 0 ? "No URLs yet. Upload a CSV to start." : "Nothing in this view."}
        </p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleAll}
                  aria-label="Select all shown"
                />
              </th>
              <th>URL</th>
              <th>Last crawled</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((rule) => (
              <tr key={rule.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(rule.id)}
                    onChange={() => toggle(rule.id)}
                    aria-label={`Select ${rule.path}`}
                  />
                </td>
                <td className="a-mono">
                  <span className={styles.host}>{rule.host}</span>
                  {rule.path}
                  {isProtectedPath(rule.path) && (
                    <span className={styles.warn} title="Looks like a live page; 410 and redirects are blocked">
                      live?
                    </span>
                  )}
                </td>
                <td>{rule.lastCrawled ?? "—"}</td>
                <td>
                  {STATUS_LABEL[rule.status]}
                  {rule.status === "redirect" && rule.redirectTo ? ` → ${rule.redirectTo}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
