"use client";

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
  /** "compact" is just the language code ("en"), no outline, flag or chevron. */
  variant?: "full" | "compact";
  /**
   * Where the menu opens. "down" hangs from the right edge (header), "up" opens
   * above and from the left (footer, where there is no room below), "inline"
   * flows in the page instead of floating (mobile menu, where a floating panel
   * is clipped by the scrolling nav).
   */
  placement?: "down" | "up" | "inline";
  copy: {
    searchPlaceholder: string;
    noResults: string;
    soon: string;
  };
};

export function LanguageSwitcher({
  locale,
  className,
  variant = "full",
  placement = "down",
  copy,
}: LanguageSwitcherProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
    // An inline menu opens inside a scrolling panel, possibly below the fold.
    menuRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    // Focusing the search on a touch screen raises the keyboard over the list.
    if (window.matchMedia("(pointer: fine)").matches) searchRef.current?.focus({ preventScroll: true });
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
        className={variant === "compact" ? `${styles.trigger} ${styles.triggerCompact}` : styles.trigger}
        aria-label={current.label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {variant === "compact" ? (
          <span className={styles.triggerLabel}>{current.language}</span>
        ) : (
          <>
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
          </>
        )}
      </button>

      {open && (
        <div ref={menuRef} className={styles.menu} data-placement={placement}>
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
          {/* data-lenis-prevent: let the list scroll natively instead of the page (smooth scroll). */}
          <ul className={styles.list} role="listbox" data-lenis-prevent>
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
                    // A locale change swaps <html lang>, fonts and market theme, so load the new
                    // locale as a fresh document (no curtain, no in-place remount of the whole tree).
                    // eslint-disable-next-line @next/next/no-html-link-for-pages
                    <a
                      href={`/${item.code}${suffix}`}
                      role="option"
                      aria-selected={isActive}
                      data-no-transition
                      className={isActive ? `${styles.option} ${styles.optionActive}` : styles.option}
                    >
                      {content}
                    </a>
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
