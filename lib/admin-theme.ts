/**
 * Light/dark theming for the /admin tool only. The marketing site is not
 * themeable this way — it varies by market via `data-market` (see
 * styles/themes/), and its palette is a brand decision, not a viewer
 * preference. The admin is a tool someone stares at for an hour, so it gets a
 * preference instead.
 *
 * Two attributes end up on <html>, both written by the bootstrap script below
 * before first paint:
 *   data-theme      — the *resolved* appearance, "light" or "dark". The only
 *                     thing CSS reads, so app/admin/admin.css needs a single
 *                     dark block rather than one per preference.
 *   data-theme-pref — the stored preference, which may also be "system".
 *                     Nothing styles off this; it keeps the choice inspectable
 *                     and lets the toggle recover state without a flash.
 *
 * Not server-only: the toggle is a client component and imports this too.
 */

export const ADMIN_THEME_STORAGE_KEY = "mellon_admin_theme";
export const DARK_COLOR_SCHEME_QUERY = "(prefers-color-scheme: dark)";

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_PREFERENCES: readonly ThemePreference[] = ["system", "light", "dark"] as const;

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

export function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia(DARK_COLOR_SCHEME_QUERY).matches;
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === "system") return systemPrefersDark() ? "dark" : "light";
  return preference;
}

/** Reads what the bootstrap script already worked out, so the toggle agrees with the page. */
export function readThemePreference(): ThemePreference {
  if (typeof document === "undefined") return "system";
  const fromDom = document.documentElement.dataset.themePref;
  if (isThemePreference(fromDom)) return fromDom;
  try {
    const stored = window.localStorage.getItem(ADMIN_THEME_STORAGE_KEY);
    if (isThemePreference(stored)) return stored;
  } catch {
    // Private mode or blocked storage — fall through to the default.
  }
  return "system";
}

export function applyThemePreference(preference: ThemePreference): ResolvedTheme {
  const resolved = resolveTheme(preference);
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.dataset.themePref = preference;
  try {
    window.localStorage.setItem(ADMIN_THEME_STORAGE_KEY, preference);
  } catch {
    // Preference just won't survive a reload; the session still themes fine.
  }
  return resolved;
}

/**
 * Runs synchronously as the first thing in <body>, before the admin markup is
 * parsed, so the correct palette is in place for the first paint. Rendering the
 * stored theme on the server is impossible — it lives in localStorage — so
 * without this the admin would flash light on every load for dark-mode users.
 *
 * Deliberately dependency-free and wrapped in try/catch: if storage is blocked
 * the SSR default of data-theme="light" simply stands.
 */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{
var p=localStorage.getItem(${JSON.stringify(ADMIN_THEME_STORAGE_KEY)});
if(p!=="light"&&p!=="dark"&&p!=="system")p="system";
var d=p==="dark"||(p==="system"&&window.matchMedia(${JSON.stringify(DARK_COLOR_SCHEME_QUERY)}).matches);
var e=document.documentElement;e.dataset.theme=d?"dark":"light";e.dataset.themePref=p;
}catch(_){}})();`;
