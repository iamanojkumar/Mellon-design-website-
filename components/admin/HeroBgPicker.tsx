"use client";

import { HERO_PASTELS, normalizeHeroBg } from "@/lib/hero-tint";
import styles from "./HeroBgPicker.module.css";

/**
 * Hero background choice: transparent (the default), a pastel preset, or any
 * custom colour. Empty string is "transparent" in the form state.
 */
export function HeroBgPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const current = normalizeHeroBg(value);

  return (
    <div className="a-field">
      <span className="a-label">Hero background</span>
      <div className={styles.row}>
        <button
          type="button"
          className={`${styles.swatch} ${styles.none}`}
          aria-pressed={!current}
          title="Transparent (default)"
          aria-label="Transparent"
          onClick={() => onChange("")}
        />
        {HERO_PASTELS.map((pastel) => (
          <button
            key={pastel.value}
            type="button"
            className={styles.swatch}
            style={{ background: pastel.value }}
            aria-pressed={current === pastel.value}
            title={pastel.name}
            aria-label={pastel.name}
            onClick={() => onChange(pastel.value)}
          />
        ))}
        <label className={styles.custom}>
          <input
            type="color"
            value={current ?? "#ffffff"}
            onChange={(event) => onChange(event.target.value)}
            aria-label="Custom colour"
          />
          <span className="a-hint">{current ?? "Transparent"}</span>
        </label>
      </div>
      <p className="a-hint">
        Covers the navigation, overline, heading, subtext and image. Transparent by default.
      </p>
    </div>
  );
}
