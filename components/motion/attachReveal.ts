import styles from "./ImageReveal.module.css";

/** Reveal styles (see ImageReveal.module.css). Each image gets a random one. */
const EFFECTS = ["up", "corner-bl", "corner-br", "middle-ltr", "middle-rtl"] as const;
let lastEffect = -1;

/** Random effect, never the same one twice in a row across the page. */
function pickEffect(): string {
  let i = Math.floor(Math.random() * EFFECTS.length);
  if (i === lastEffect) i = (i + 1 + Math.floor(Math.random() * (EFFECTS.length - 1))) % EFFECTS.length;
  lastEffect = i;
  return EFFECTS[i];
}

/** How far below the viewport (px) an image starts loading. */
const PRELOAD_MARGIN = 800;
/** The reveal plays once the frame's top is this far up the viewport (fraction). */
const REVEAL_LINE = 0.9;

/**
 * Bottom-to-top image reveal when `frame` scrolls into view. Client-only: call it
 * from an effect. The frame is left fully visible until this runs (and for
 * reduced motion / no scripting), so nothing is ever stuck hidden.
 *
 * Position is checked from scroll/resize events with getBoundingClientRect
 * rather than an IntersectionObserver: the hidden frame is clipped to nothing,
 * which makes observer results unreliable (and native lazy-loading treats a
 * clipped image as off-screen, so it would never load). So we also start the
 * image loading ourselves, shortly before it's due, and arm the reveal only once
 * it has loaded — before that the frame is a ~0px box and "in view" means nothing.
 * A broken image still reveals rather than staying hidden.
 *
 * Returns a cleanup that restores the frame.
 */
export function attachReveal(frame: HTMLElement, img?: HTMLImageElement): () => void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};

  frame.classList.add(styles.inView);
  frame.dataset.effect = pickEffect();
  frame.dataset.reveal = "pending";

  let loaded = !img || (img.complete && img.naturalWidth > 0);
  let revealed = false;

  const check = () => {
    if (revealed) return;
    const rect = frame.getBoundingClientRect();
    const vh = window.innerHeight;

    if (!loaded) {
      if (img && rect.top < vh + PRELOAD_MARGIN && img.loading !== "eager") {
        img.loading = "eager";
      }
      return;
    }

    if (rect.height > 0 && rect.bottom > 0 && rect.top < vh * REVEAL_LINE) {
      revealed = true;
      frame.dataset.reveal = "in";
      stop();
    }
  };

  // A few rect reads per scroll event is cheap, and unlike requestAnimationFrame
  // this still runs when the tab isn't being rendered.
  const schedule = check;

  const onLoaded = () => {
    loaded = true;
    schedule();
  };

  const stop = () => {
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    img?.removeEventListener("load", onLoaded);
    img?.removeEventListener("error", onLoaded);
  };

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  if (img && !loaded) {
    img.addEventListener("load", onLoaded, { once: true });
    img.addEventListener("error", onLoaded, { once: true });
  }
  check();

  return () => {
    revealed = true;
    stop();
    delete frame.dataset.reveal;
    delete frame.dataset.effect;
    frame.classList.remove(styles.inView);
  };
}

/** Class for a frame that should reveal on page load (CSS-only, hero images). */
export const revealOnLoadClass = styles.onLoad;
