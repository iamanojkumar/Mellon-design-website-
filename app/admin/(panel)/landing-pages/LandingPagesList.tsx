"use client";

import { useState } from "react";
import styles from "./landing-pages.module.css";

export type LandingPageRow = {
  slug: string;
  locale: string;
  indexable: boolean;
  path: string;
};

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function LandingPagesList({ rows }: { rows: LandingPageRow[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  const fullUrl = (path: string) => `${window.location.origin}${path}`;

  async function copyUrl(path: string) {
    try {
      await navigator.clipboard.writeText(fullUrl(path));
      setCopied(path);
      setTimeout(() => setCopied((current) => (current === path ? null : current)), 1500);
    } catch {
      window.prompt("Copy this URL", fullUrl(path));
    }
  }

  function downloadCsv() {
    const lines = [
      ["slug", "locale", "url", "indexing"],
      ...rows.map((row) => [
        row.slug,
        row.locale,
        fullUrl(row.path),
        row.indexable ? "indexed" : "noindex",
      ]),
    ].map((cols) => cols.map(csvCell).join(","));

    const blob = new Blob([lines.join("\r\n") + "\r\n"], { type: "text/csv;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = "landing-pages.csv";
    link.click();
    URL.revokeObjectURL(href);
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>Landing pages</h1>
          <p className="a-hint">
            {rows.length} live {rows.length === 1 ? "page" : "pages"}. Registered in
            lib/landing-pages.ts.
          </p>
        </div>
        <button type="button" className="a-btn" onClick={downloadCsv}>
          Download CSV
        </button>
      </header>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Page</th>
            <th>Locale</th>
            <th>Indexing</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.path}>
              <td>
                <div>{row.slug}</div>
                <div className="a-mono a-hint">{row.path}</div>
              </td>
              <td className="a-mono">{row.locale}</td>
              <td>{row.indexable ? "Indexed" : "noindex"}</td>
              <td className={styles.actions}>
                <button type="button" className="a-btn" onClick={() => copyUrl(row.path)}>
                  {copied === row.path ? "Copied" : "Copy URL"}
                </button>{" "}
                <a className="a-btn" href={row.path} target="_blank" rel="noopener noreferrer">
                  Open ↗
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
