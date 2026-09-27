"use client";

import { useEffect, useState } from "react";
import {
  DARK_COLOR_SCHEME_QUERY,
  applyThemePreference,
  readThemePreference,
  resolveTheme,
  type ThemePreference,
} from "@/lib/admin-theme";
import styles from "./ThemeToggle.module.css";

const OPTIONS: { value: ThemePreference; glyph: string; label: string }[] = [
  { value: "system", glyph: "◐", label: "Match system" },
  { value: "light", glyph: "☀", label: "Light" },
  { value: "dark", glyph: "☾", label: "Dark" },
];

export function ThemeToggle() {
  // Starts at the SSR default and syncs on mount rather than reading storage in
  // the initialiser, which would hydrate against different markup. The page
  // itself is already correctly themed by then (lib/admin-theme.ts), so the
  // only thing settling here is which segment reads as active.
  const [preference, setPreference] = useState<ThemePreference>("system");

  useEffect(() => {
    setPreference(readThemePreference());
  }, []);

  // Following the system means following it live, not just at load.
  useEffect(() => {
    if (preference !== "system") return;
    const query = window.matchMedia(DARK_COLOR_SCHEME_QUERY);
    const sync = () => {
      document.documentElement.dataset.theme = resolveTheme("system");
    };
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, [preference]);

  const choose = (next: ThemePreference) => {
    setPreference(next);
    applyThemePreference(next);
  };

  return (
    <div className={styles.group} role="group" aria-label="Theme">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={styles.option}
          aria-pressed={preference === option.value}
          title={option.label}
          onClick={() => choose(option.value)}
        >
          <span aria-hidden="true">{option.glyph}</span>
          <span className={styles.srOnly}>{option.label}</span>
        </button>
      ))}
    </div>
  );
}
