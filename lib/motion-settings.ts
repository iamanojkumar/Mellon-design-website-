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
  /** Hide the native cursor while the trail is moving; it returns when the cursor stops. */
  cursorHideNative: boolean;
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
  /** Image layer master multiplier (scales its blur + warp). */
  cursorFxImageIntensity: number;
  /** Background layer master multiplier (scales its blur + warp). */
  cursorFxBackdropIntensity: number;
  /** Extra blur/warp applied only where the trail crosses an image. */
  cursorFxImageFx: boolean;
  /** Image layer: max blur (px) at full speed. */
  cursorFxImageBlur: number;
  /** Image layer: max warp (px) at full speed. */
  cursorFxImageWarp: number;
  /** Max backdrop blur (px) at full speed. */
  cursorFxBackdropBlur: number;
  /** Max backdrop shift/distortion (px) at full speed. */
  cursorFxBackdropWarp: number;
  /** When the cursor stops: how fast the blob spreads outward (scale per frame). */
  cursorFxDissolveSpread: number;
  /** When the cursor stops: fade per frame (lower = slower dissolve). */
  cursorFxIdleFade: number;
  /** Scroll blur: progressive blur along the bottom edge + vertical motion blur on scroll. */
  scrollBlurEnabled: boolean;
  /** Bottom-edge blur (px) at full scroll speed. Zero at rest: it only shows while scrolling. */
  scrollBlurBottom: number;
  /** Height of the bottom blur band, in vh. */
  scrollBlurHeight: number;
  /** Vertical motion blur (px) in the bottom band at full scroll speed. */
  scrollBlurMotion: number;
  /** Fade-in time (ms) when scrolling starts. */
  scrollBlurFadeIn: number;
  /** Fade-out time (ms) after scrolling stops. */
  scrollBlurFadeOut: number;
  /** Hovering a nav link blurs/dims the other nav links. */
  navHoverEnabled: boolean;
  /** Image liquify: dragging the cursor across an image stirs it like liquid. */
  liquifyEnabled: boolean;
  /** How hard the cursor drags the image (1 = about six frames of cursor travel). */
  liquifyStrength: number;
  /** Size of the "finger", as a fraction of the viewport height. */
  liquifyRadius: number;
  /** Settle speed: per-frame decay. Higher = the liquid keeps moving for longer. */
  liquifyRelax: number;
  /** Viscosity: smoothing of the flow (0 = thin/watery, high = thick/syrupy). */
  liquifyViscosity: number;
  /** Swirl: sideways component that curls the flow around the cursor's path. */
  liquifySwirl: number;
  /** Flow: how much the disturbed liquid carries itself along as it settles. */
  liquifyFlow: number;
  /** Blur (px) applied to the non-hovered nav links. */
  navHoverBlur: number;
  /** Opacity of the non-hovered nav links (1 = no dimming). */
  navHoverDim: number;
  /** The hovered nav link runs a one-off text scramble. */
  navScrambleEnabled: boolean;
  /** Duration (ms) of that scramble. */
  navScrambleMs: number;
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

/** Saved as "preset_1": the look agreed on in the debugger. */
const PRESET_1: MotionSettings = {
  scrollEnabled: true,
  scrollLerp: 0.03,
  scrollWheelMultiplier: 0.75,
  cursorFxEnabled: true,
  cursorHideNative: true,
  cursorFxIntensity: 0.13,
  cursorFxRadius: 0.06,
  cursorFxFade: 0.06,
  cursorFxSpread: 0.4,
  cursorFxEdge: 9.5,
  cursorFxSaturation: 0.76,
  cursorFxBlur: 4,
  cursorFxOrganic: 0.65,
  cursorFxBlobs: 1,
  cursorFxLag: 0.95,
  cursorFxRecoil: 20,
  cursorFxBlend: "normal",
  cursorFxBackdrop: true,
  cursorFxImageIntensity: 1,
  cursorFxBackdropIntensity: 1,
  cursorFxImageFx: true,
  cursorFxImageBlur: 10,
  cursorFxImageWarp: 14,
  cursorFxBackdropBlur: 24,
  cursorFxBackdropWarp: 40,
  cursorFxDissolveSpread: 0.009,
  cursorFxIdleFade: 0.09,
  scrollBlurEnabled: true,
  scrollBlurBottom: 10,
  scrollBlurHeight: 40,
  scrollBlurMotion: 4,
  scrollBlurFadeIn: 120,
  scrollBlurFadeOut: 400,
  navHoverEnabled: true,
  liquifyEnabled: true,
  liquifyStrength: 1,
  liquifyRadius: 0.1,
  liquifyRelax: 0.965,
  liquifyViscosity: 0.25,
  liquifySwirl: 0.35,
  liquifyFlow: 0.5,
  navHoverBlur: 2.5,
  navHoverDim: 0.5,
  navScrambleEnabled: true,
  navScrambleMs: 500,
};

/** Named presets, selectable in the dev debugger. Add new ones here. */
export const PRESETS: Record<string, MotionSettings> = {
  preset_1: PRESET_1,
};

export const DEFAULT_SETTINGS: MotionSettings = PRESET_1;

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
  { key: "cursorFxDissolveSpread", label: "Dissolve: spread on stop", min: 0, max: 0.04, step: 0.001 },
  { key: "cursorFxIdleFade", label: "Dissolve: fade on stop (lower = slower)", min: 0.01, max: 0.2, step: 0.005 },
  { key: "cursorFxRecoil", label: "Restart fade-in (ms)", min: 0, max: 800, step: 10 },
];

export const BACKDROP_FX_SLIDERS: SliderDef[] = [
  { key: "cursorFxBackdropIntensity", label: "Intensity (master, scales blur + warp)", min: 0, max: 2.5, step: 0.05 },
  { key: "cursorFxBackdropBlur", label: "Blur at full speed (px)", min: 0, max: 40, step: 0.5 },
  { key: "cursorFxBackdropWarp", label: "Warp at full speed (px)", min: 0, max: 80, step: 0.5 },
];

export const IMAGE_FX_SLIDERS: SliderDef[] = [
  { key: "cursorFxImageIntensity", label: "Intensity (master, scales blur + warp)", min: 0, max: 2.5, step: 0.05 },
  { key: "cursorFxImageBlur", label: "Blur at full speed (px)", min: 0, max: 40, step: 0.5 },
  { key: "cursorFxImageWarp", label: "Warp at full speed (px)", min: 0, max: 80, step: 0.5 },
];

export const LIQUIFY_SLIDERS: SliderDef[] = [
  { key: "liquifyStrength", label: "Strength (how hard it drags)", min: 0, max: 3, step: 0.05 },
  { key: "liquifyRadius", label: "Finger size (fraction of screen height)", min: 0.03, max: 0.3, step: 0.005 },
  { key: "liquifyRelax", label: "Settle: higher = flows for longer", min: 0.9, max: 0.995, step: 0.001 },
  { key: "liquifyViscosity", label: "Viscosity (0 watery, high syrupy)", min: 0, max: 0.9, step: 0.01 },
  { key: "liquifySwirl", label: "Swirl", min: 0, max: 1.5, step: 0.05 },
  { key: "liquifyFlow", label: "Flow (carries itself along)", min: 0, max: 1.5, step: 0.05 },
];

export const NAV_HOVER_SLIDERS: SliderDef[] = [
  { key: "navHoverBlur", label: "Blur on other links (px)", min: 0, max: 10, step: 0.25 },
  { key: "navHoverDim", label: "Opacity of other links", min: 0.1, max: 1, step: 0.05 },
  { key: "navScrambleMs", label: "Scramble duration (ms)", min: 150, max: 1500, step: 25 },
];

export const SCROLL_BLUR_SLIDERS: SliderDef[] = [
  { key: "scrollBlurBottom", label: "Bottom blur while scrolling (px)", min: 0, max: 30, step: 0.5 },
  { key: "scrollBlurHeight", label: "Bottom blur height (vh)", min: 6, max: 80, step: 1 },
  { key: "scrollBlurFadeIn", label: "Fade in when scrolling starts (ms)", min: 20, max: 800, step: 10 },
  { key: "scrollBlurFadeOut", label: "Fade out when scrolling stops (ms)", min: 100, max: 2500, step: 50 },
  { key: "scrollBlurMotion", label: "Motion blur on scroll (px)", min: 0, max: 16, step: 0.25 },
];

const STORAGE_KEY = "mellon:motion-settings:v10";

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
