"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  BLEND_MODES,
  BACKDROP_FX_SLIDERS,
  CURSOR_FX_SLIDERS,
  IMAGE_FX_SLIDERS,
  LIQUIFY_SLIDERS,
  NAV_HOVER_SLIDERS,
  PRESETS,
  SCROLL_BLUR_SLIDERS,
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
const SECTIONS_KEY = "mellon:debug-sections";

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

function PresetSelect() {
  return (
    <label className={styles.row}>
      <span className={styles.rowHead}>
        <span>Load preset</span>
      </span>
      <select
        className={styles.select}
        value=""
        onChange={(e) => {
          const preset = PRESETS[e.target.value];
          if (preset) setSettings(preset);
        }}
      >
        <option value="">Choose…</option>
        {Object.keys(PRESETS).map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </label>
  );
}

function Accordion({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.acc}>
      <button
        type="button"
        className={styles.accHead}
        aria-expanded={open}
        onClick={onToggle}
      >
        <span>{title}</span>
        <span aria-hidden="true" className={styles.accIcon} data-open={open}>
          +
        </span>
      </button>
      {open && <div className={styles.accBody}>{children}</div>}
    </section>
  );
}

/** Dev-only pane for live-tuning motion. Toggle with the button or Ctrl+Shift+D. */
export function DebugPanel() {
  const s = useSyncExternalStore(subscribeSettings, getSettings, getServerSettings);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sections, setSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SECTIONS_KEY);
      if (raw) setSections(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const toggleSection = (id: string) =>
    setSections((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        window.localStorage.setItem(SECTIONS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });

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
        <PresetSelect />
      </section>

      <Accordion title="Smooth scroll" open={!!sections.scroll} onToggle={() => toggleSection("scroll")}>
        <Toggle label="Enabled" k="scrollEnabled" value={s.scrollEnabled} />
        {SCROLL_SLIDERS.map((def) => (
          <Slider key={def.key} def={def} value={s[def.key] as number} />
        ))}
      </Accordion>

      <Accordion title="Scroll blur (bottom + motion)" open={!!sections.scrollBlur} onToggle={() => toggleSection("scrollBlur")}>
        <Toggle label="Enabled" k="scrollBlurEnabled" value={s.scrollBlurEnabled} />
        {SCROLL_BLUR_SLIDERS.map((def) => (
          <Slider key={def.key} def={def} value={s[def.key] as number} />
        ))}
      </Accordion>

      <Accordion title="Cursor trail" open={!!sections.cursor} onToggle={() => toggleSection("cursor")}>
        <Toggle label="Enabled" k="cursorFxEnabled" value={s.cursorFxEnabled} />
        <BlendSelect value={s.cursorFxBlend} />
        {CURSOR_FX_SLIDERS.map((def) => (
          <Slider key={def.key} def={def} value={s[def.key] as number} />
        ))}
      </Accordion>

      <Accordion title="Background blur & warp (cursor)" open={!!sections.bg} onToggle={() => toggleSection("bg")}>
        <Toggle label="Enabled (all content under the trail)" k="cursorFxBackdrop" value={s.cursorFxBackdrop} />
        {BACKDROP_FX_SLIDERS.map((def) => (
          <Slider key={def.key} def={def} value={s[def.key] as number} />
        ))}
      </Accordion>

      <Accordion title="Image distortion (cursor)" open={!!sections.image} onToggle={() => toggleSection("image")}>
        <Toggle label="Enabled (images only, on top of the background layer)" k="cursorFxImageFx" value={s.cursorFxImageFx} />
        {IMAGE_FX_SLIDERS.map((def) => (
          <Slider key={def.key} def={def} value={s[def.key] as number} />
        ))}
      </Accordion>

      <Accordion title="Image liquify (cursor)" open={!!sections.liquify} onToggle={() => toggleSection("liquify")}>
        <Toggle label="Enabled (stir images like liquid)" k="liquifyEnabled" value={s.liquifyEnabled} />
        {LIQUIFY_SLIDERS.map((def) => (
          <Slider key={def.key} def={def} value={s[def.key] as number} />
        ))}
      </Accordion>

      <Accordion title="Nav hover blur" open={!!sections.nav} onToggle={() => toggleSection("nav")}>
        <Toggle label="Blur/dim the other links" k="navHoverEnabled" value={s.navHoverEnabled} />
        <Toggle label="Scramble the hovered link once" k="navScrambleEnabled" value={s.navScrambleEnabled} />
        {NAV_HOVER_SLIDERS.map((def) => (
          <Slider key={def.key} def={def} value={s[def.key] as number} />
        ))}
      </Accordion>

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
