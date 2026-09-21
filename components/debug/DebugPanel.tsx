"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  BLEND_MODES,
  CURSOR_FX_SLIDERS,
  SCROLL_SLIDERS,
  getServerSettings,
  getSettings,
  resetSettings,
  setSettings,
  subscribeSettings,
  type MotionSettings,
  type SliderDef,
} from "@/lib/motion-settings";
import styles from "./DebugPanel.module.css";

const OPEN_KEY = "mellon:debug-open";

function Slider({ def, value }: { def: SliderDef; value: number }) {
  return (
    <label className={styles.row}>
      <span className={styles.rowHead}>
        <span>{def.label}</span>
        <output>{value.toFixed(def.step < 0.01 ? 3 : 2)}</output>
      </span>
      <input
        type="range"
        min={def.min}
        max={def.max}
        step={def.step}
        value={value}
        onChange={(e) => setSettings({ [def.key]: Number(e.target.value) })}
      />
    </label>
  );
}

function Toggle({
  label,
  k,
  value,
}: {
  label: string;
  k: keyof MotionSettings;
  value: boolean;
}) {
  return (
    <label className={styles.toggle}>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => setSettings({ [k]: e.target.checked })}
      />
      <span>{label}</span>
    </label>
  );
}

function BlendSelect({ value }: { value: string }) {
  return (
    <label className={styles.row}>
      <span className={styles.rowHead}>
        <span>Blend mode</span>
      </span>
      <select
        className={styles.select}
        value={value}
        onChange={(e) => setSettings({ cursorFxBlend: e.target.value })}
      >
        {BLEND_MODES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Dev-only pane for live-tuning motion. Toggle with the button or Ctrl+Shift+D. */
export function DebugPanel() {
  const s = useSyncExternalStore(subscribeSettings, getSettings, getServerSettings);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      setOpen(window.localStorage.getItem(OPEN_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = (next: boolean) => {
    setOpen(next);
    try {
      window.localStorage.setItem(OPEN_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setOpen((o) => {
          const next = !o;
          try {
            window.localStorage.setItem(OPEN_KEY, next ? "1" : "0");
          } catch {
            /* ignore */
          }
          return next;
        });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(s, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard blocked */
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        className={styles.fab}
        onClick={() => toggle(true)}
        aria-label="Open motion debugger"
        data-lenis-prevent
      >
        Motion
      </button>
    );
  }

  return (
    <aside className={styles.panel} aria-label="Motion debugger" data-lenis-prevent>
      <header className={styles.header}>
        <strong>Motion debugger</strong>
        <button type="button" onClick={() => toggle(false)} aria-label="Close debugger">
          ×
        </button>
      </header>

      <section>
        <h3>Smooth scroll</h3>
        <Toggle label="Enabled" k="scrollEnabled" value={s.scrollEnabled} />
        {SCROLL_SLIDERS.map((def) => (
          <Slider key={def.key} def={def} value={s[def.key] as number} />
        ))}
      </section>

      <section>
        <h3>Cursor trail (page-wide)</h3>
        <Toggle label="Enabled" k="cursorFxEnabled" value={s.cursorFxEnabled} />
        <BlendSelect value={s.cursorFxBlend} />
        <Toggle label="Blur/warp content behind" k="cursorFxBackdrop" value={s.cursorFxBackdrop} />
        {CURSOR_FX_SLIDERS.map((def) => (
          <Slider key={def.key} def={def} value={s[def.key] as number} />
        ))}
      </section>

      <footer className={styles.footer}>
        <button type="button" onClick={resetSettings}>
          Reset
        </button>
        <button type="button" onClick={copy}>
          {copied ? "Copied" : "Copy JSON"}
        </button>
      </footer>
    </aside>
  );
}
