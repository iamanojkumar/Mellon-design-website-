"use client";

import { useState } from "react";
import type { UrlRule } from "@/lib/url-rules-store";
import { NotFoundTab } from "./NotFoundTab";
import styles from "./IndexingApp.module.css";

const TABS = [{ id: "404", label: "404 pages" }] as const;

export function IndexingApp({
  initialRules,
  initialError,
}: {
  initialRules: UrlRule[];
  initialError: string | null;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("404");

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Indexing</h1>
        <div className={styles.tabs} role="tablist">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={styles.tab}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>
      <div className={styles.body}>
        {tab === "404" && <NotFoundTab initialRules={initialRules} initialError={initialError} />}
      </div>
    </div>
  );
}
