"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import "flag-icons/css/flag-icons.min.css";
import { allLocales, enabledLocales } from "@/lib/locale";
import styles from "./LanguageSwitcher.module.css";

// A search box only earns its space once the list gets long.
const SEARCH_THRESHOLD = 6;

type LanguageSwitcherProps = {
  locale: string;
  className?: string;
  copy: {
    searchPlaceholder: string;
    noResults: string;
    soon: string;
  };
};

export function LanguageSwitcher({ locale, className, copy }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const current = allLocales.find((item) => item.code === locale) ?? enabledLocales[0];
  const suffix = pathname.startsWith(`/${locale}`)
    ? pathname.slice(`/${locale}`.length)
    : "";

  const needle = query.trim().toLowerCase();
  const results = needle
    ? enabledLocales.filter((item) =>
        `${item.country} ${item.label} ${item.code} ${item.language} ${item.market}`
          .toLowerCase()
          .includes(needle),
      )
    : enabledLocales;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    searchRef.current?.focus();
    function handleClick(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={className ? `${styles.root} ${className}` : styles.root}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`fi fi-${current.market.toLowerCase()} ${styles.flag}`} aria-hidden="true" />
        <span className={styles.triggerLabel}>{current.label.split(" (")[0]}</span>
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true" className={styles.chevron} data-open={open}>
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className={styles.menu}>
          {enabledLocales.length > SEARCH_THRESHOLD && (
            <input
              ref={searchRef}
              type="search"
              className={styles.search}
              placeholder={copy.searchPlaceholder}
              aria-label={copy.searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          )}
          <ul className={styles.list} role="listbox">
            {results.length === 0 && <li className={styles.empty}>{copy.noResults}</li>}
            {results.map((item) => {
              const isActive = item.code === locale;
              const content = (
                <>
                  <span className={`fi fi-${item.market.toLowerCase()} ${styles.flag}`} aria-hidden="true" />
                  <span className={styles.optionLabel}>{item.label}</span>
                  {!item.enabled && <span className={styles.soon}>{copy.soon}</span>}
                </>
              );
              return (
                <li key={item.code}>
                  {item.enabled ? (
                    <Link
                      href={`/${item.code}${suffix}`}
                      role="option"
                      aria-selected={isActive}
                      className={isActive ? `${styles.option} ${styles.optionActive}` : styles.option}
                    >
                      {content}
                    </Link>
                  ) : (
                    <span
                      role="option"
                      aria-selected={false}
                      aria-disabled="true"
                      className={`${styles.option} ${styles.optionDisabled}`}
                    >
                      {content}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
