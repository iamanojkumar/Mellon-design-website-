/**
 * Live-tunable motion settings, shared by the effects and the dev debug panel.
 * A tiny external store (no context/provider) so non-React code such as the
 * WebGL render loop can read the latest values without re-rendering.
 */

export type MotionSettings = {
  scrollEnabled: boolean;
  /** Lenis lerp: lower = floatier / smoother, higher = snappier. */
  scrollLerp: number;
  scrollWheelMultiplier: number;
  cursorFxEnabled: boolean;
  /** Overall opacity of the iridescent trail. */
  cursorFxIntensity: number;
  /** Brush radius as a fraction of the trail width. */
  cursorFxRadius: number;
  /** Trail fade per frame: lower = longer-lasting trail. */
  cursorFxFade: number;
  /** Rainbow spread: how quickly colours cycle across the ridge. */
  cursorFxSpread: number;
  /** Edge sharpness / ridge thickness gain. */
  cursorFxEdge: number;
  /** 0 = grey, 1 = full rainbow. */
  cursorFxSaturation: number;
  /** Motion-blur streak along the pointer direction (0 = off). */
  cursorFxBlur: number;
  /** Organic blob wander: how far the blobs roam around the head (0 = one round blob). */
  cursorFxOrganic: number;
  /** Number of blobs merged into the liquid head. */
  cursorFxBlobs: number;
  /** Head lag behind the pointer (0 = instant, 1 = heavy and floaty). */
  cursorFxLag: number;
  /** Fade-in time (ms) when a new stroke starts after a stop (opacity only, never size). */
  cursorFxRecoil: number;
  /** CSS mix-blend-mode applied to the trail overlay. */
  cursorFxBlend: string;
  /** Blur/warp the page content behind the trail, along the move direction. */
  cursorFxBackdrop: boolean;
  /** Max backdrop blur (px) at full speed. */
  cursorFxBackdropBlur: number;
  /** Max backdrop shift/distortion (px) at full speed. */
  cursorFxBackdropWarp: number;
  /** When the cursor stops: how fast the blob spreads outward (scale per frame). */
  cursorFxDissolveSpread: number;
  /** When the cursor stops: fade per frame (lower = slower dissolve). */
  cursorFxIdleFade: number;
};

export const BLEND_MODES = [
  "normal",
  "multiply",
  "screen",
  "overlay",
  "soft-light",
  "hard-light",
  "color-dodge",
  "color-burn",
  "darken",
  "lighten",
  "difference",
  "exclusion",
  "hue",
  "saturation",
  "color",
  "luminosity",
  "plus-lighter",
] as const;

export type SliderDef = {
  key: keyof MotionSettings;
  label: string;
  min: number;
  max: number;
  step: number;
};

export const DEFAULT_SETTINGS: MotionSettings = {
  scrollEnabled: true,
  scrollLerp: 0.03,
  scrollWheelMultiplier: 0.75,
  cursorFxEnabled: true,
  cursorFxIntensity: 0.13,
  cursorFxRadius: 0.11,
  cursorFxFade: 0.06,
  cursorFxSpread: 0.4,
  cursorFxEdge: 9.5,
  cursorFxSaturation: 0.76,
  cursorFxBlur: 4,
  cursorFxOrganic: 1.5,
  cursorFxBlobs: 1,
  cursorFxLag: 0.95,
  cursorFxRecoil: 60,
  cursorFxBlend: "normal",
  cursorFxBackdrop: true,
  cursorFxBackdropBlur: 24,
  cursorFxBackdropWarp: 40,
  cursorFxDissolveSpread: 0.009,
  cursorFxIdleFade: 0.09,
};

export const SCROLL_SLIDERS: SliderDef[] = [
  { key: "scrollLerp", label: "Smoothness (lerp, lower = smoother)", min: 0.02, max: 0.3, step: 0.01 },
  { key: "scrollWheelMultiplier", label: "Wheel speed", min: 0.3, max: 2.5, step: 0.05 },
];

export const CURSOR_FX_SLIDERS: SliderDef[] = [
  { key: "cursorFxIntensity", label: "Intensity", min: 0, max: 1, step: 0.01 },
  { key: "cursorFxRadius", label: "Brush size", min: 0.015, max: 0.15, step: 0.005 },
  { key: "cursorFxFade", label: "Fade per frame (lower = longer)", min: 0.005, max: 0.15, step: 0.005 },
  { key: "cursorFxSpread", label: "Rainbow spread", min: 0, max: 6, step: 0.1 },
  { key: "cursorFxEdge", label: "Edge sharpness", min: 1, max: 30, step: 0.5 },
  { key: "cursorFxSaturation", label: "Colour saturation", min: 0, max: 1, step: 0.01 },
  { key: "cursorFxBlur", label: "Motion blur", min: 0, max: 4, step: 0.1 },
  { key: "cursorFxOrganic", label: "Organic (blob wander)", min: 0, max: 2.5, step: 0.05 },
  { key: "cursorFxBlobs", label: "Blob count", min: 1, max: 12, step: 1 },
  { key: "cursorFxLag", label: "Head lag", min: 0, max: 0.95, step: 0.01 },
  { key: "cursorFxBackdropBlur", label: "Backdrop blur (px)", min: 0, max: 24, step: 0.5 },
  { key: "cursorFxBackdropWarp", label: "Backdrop warp (px)", min: 0, max: 40, step: 0.5 },
  { key: "cursorFxDissolveSpread", label: "Dissolve: spread on stop", min: 0, max: 0.04, step: 0.001 },
  { key: "cursorFxIdleFade", label: "Dissolve: fade on stop (lower = slower)", min: 0.01, max: 0.2, step: 0.005 },
  { key: "cursorFxRecoil", label: "Restart fade-in (ms)", min: 0, max: 800, step: 10 },
];

const STORAGE_KEY = "mellon:motion-settings:v8";

let state: MotionSettings = DEFAULT_SETTINGS;
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  // Saved tweaks come from the dev debug panel only. Production always uses the defaults,
  // so stale values in a browser can never change how the live site behaves.
  if (process.env.NODE_ENV !== "development") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) state = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    /* storage unavailable or corrupt: keep defaults */
  }
}

export function getSettings(): MotionSettings {
  hydrate();
  return state;
}

export function getServerSettings(): MotionSettings {
  return DEFAULT_SETTINGS;
}

export function setSettings(patch: Partial<MotionSettings>) {
  hydrate();
  state = { ...state, ...patch };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function resetSettings() {
  setSettings(DEFAULT_SETTINGS);
}

export function subscribeSettings(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
