"use client";

import { useEffect, useRef } from "react";
import { getSettings, subscribeSettings } from "@/lib/motion-settings";
import { attachReveal } from "./attachReveal";

/**
 * Scroll parallax for project imagery: the picture drifts slowly against the
 * frame that clips it as the card passes through the viewport.
 *
 * The drift is expressed as a fraction of the image's own height rather than a
 * pixel count, and the scale is derived from it (1 + 2 × strength). That makes
 * the overflow it needs exactly equal to the distance it travels, so the frame
 * can never reveal an edge at any card size or any strength — including
 * whatever the debug panel is set to.
 *
 * One rAF loop and one IntersectionObserver are shared by every instance on
 * the page. A card grid can hold a dozen of these, and a loop each would mean
 * a dozen layout reads per frame; off-screen images are unregistered from the
 * loop entirely rather than computed and thrown away.
 *
 * That is the "cover" fit, and the scale crops the picture's edges, which is
 * fine for card thumbnails but not for screenshots. The "contain" fit never
 * scales: the frame reserves a small band above and below the image (padding,
 * so it is only added while the effect runs) and the whole image drifts inside
 * it, so every pixel stays visible.
 *
 * Skipped for reduced-motion, where it simply renders a static image.
 */

export type ParallaxFit = "cover" | "contain";

/**
 * Contain-fit drift in px per unit of parallaxStrength: the default 0.08 gives
 * ±24px. Tied to a fixed scale rather than the image's height, because a
 * full-page screenshot is thousands of px tall and would get a huge gap.
 */
const CONTAIN_TRAVEL_PER_STRENGTH = 300;

type Entry = {
  frame: HTMLElement;
  img: HTMLImageElement;
  fit: ParallaxFit;
  /** Contain fit: the padding last written on the frame, to skip no-op writes. */
  reserved: number;
  /** Eased value chasing the raw scroll progress, so the drift lags slightly. */
  current: number;
  target: number;
};

const active = new Set<Entry>();
let raf = 0;
let observer: IntersectionObserver | null = null;
const registry = new WeakMap<Element, Entry>();

function tick() {
  const { parallaxStrength, parallaxEase } = getSettings();
  const viewportH = window.innerHeight;

  for (const entry of active) {
    const rect = entry.frame.getBoundingClientRect();
    const half = rect.height / 2;
    const center = rect.top + half;
    // +1 when the frame sits a full pass below the viewport centre, -1 above.
    const span = viewportH / 2 + half;
    const progress = span > 0 ? Math.max(-1, Math.min(1, (center - viewportH / 2) / span)) : 0;

    entry.target = progress;
    entry.current += (entry.target - entry.current) * parallaxEase;

    if (entry.fit === "contain") {
      const travel = Math.round(parallaxStrength * CONTAIN_TRAVEL_PER_STRENGTH);
      reserve(entry, travel);
      entry.img.style.transform = `translate3d(0, ${(entry.current * travel).toFixed(2)}px, 0)`;
      continue;
    }

    const shift = entry.current * parallaxStrength * rect.height;
    const scale = 1 + 2 * parallaxStrength;
    entry.img.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
  }

  raf = active.size > 0 ? requestAnimationFrame(tick) : 0;
}

/** Contain fit: room above and below the image for it to drift into. */
function reserve(entry: Entry, travel: number) {
  if (entry.reserved === travel) return;
  entry.reserved = travel;
  entry.frame.style.paddingBlock = travel ? `${travel}px` : "";
}

function start() {
  if (!raf && active.size > 0) raf = requestAnimationFrame(tick);
}

function getObserver(): IntersectionObserver {
  if (observer) return observer;
  observer = new IntersectionObserver(
    (entries) => {
      for (const record of entries) {
        const entry = registry.get(record.target);
        if (!entry) continue;
        if (record.isIntersecting) active.add(entry);
        else active.delete(entry);
      }
      start();
    },
    // A margin so the drift is already settled by the time a card scrolls in.
    { rootMargin: "20% 0px" },
  );
  return observer;
}

/**
 * Registers an <img> for parallax inside `frame` (the clipping element) and
 * returns a cleanup. Follows the debug-panel toggle and reduced-motion live.
 * Exported so images this component didn't render — e.g. ones inside
 * editor-authored HTML — can join the same shared loop.
 */
export function attachParallax(
  frame: HTMLElement,
  img: HTMLImageElement,
  fit: ParallaxFit = "cover",
): () => void {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let entry: Entry | null = null;
  const imgRadius = img.style.borderRadius;

  const attach = () => {
    if (entry || !getSettings().parallaxEnabled || reduced.matches) return;
    entry = { frame, img, fit, reserved: 0, current: 0, target: 0 };
    registry.set(frame, entry);
    if (fit === "contain") {
      // The image no longer fills the frame, so the frame's rounded corners
      // would round the empty band instead; give them to the image.
      img.style.borderRadius = getComputedStyle(frame).borderRadius;
      // Reserve the band now, not on the first frame, so the layout doesn't
      // jump when the image scrolls into range.
      reserve(entry, Math.round(getSettings().parallaxStrength * CONTAIN_TRAVEL_PER_STRENGTH));
    }
    getObserver().observe(frame);
  };

  const detach = () => {
    if (!entry) return;
    getObserver().unobserve(frame);
    active.delete(entry);
    registry.delete(frame);
    // Hand the image back exactly as it was, so a disabled effect leaves no
    // residual transform behind.
    reserve(entry, 0);
    img.style.transform = "";
    img.style.borderRadius = imgRadius;
    entry = null;
  };

  const sync = () => {
    if (getSettings().parallaxEnabled && !reduced.matches) attach();
    else detach();
  };

  sync();
  reduced.addEventListener("change", sync);
  const unsubscribe = subscribeSettings(sync);
  return () => {
    reduced.removeEventListener("change", sync);
    unsubscribe();
    detach();
  };
}

export function ParallaxImage({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  revealOnView = false,
  fit = "cover",
}: {
  src: string;
  alt: string;
  /** Applied to the <img>; the clipping frame is the parent element. */
  className?: string;
  width?: number;
  height?: number;
  /** True for an LCP hero: loads eagerly at high priority instead of lazily. */
  priority?: boolean;
  /** Also reveal the frame bottom-to-top when it scrolls into view. */
  revealOnView?: boolean;
  /** "contain" keeps the whole image visible; use it for screenshots. */
  fit?: ParallaxFit;
}) {
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = ref.current;
    const frame = img?.parentElement;
    if (!img || !frame) return;
    const detachParallax = attachParallax(frame, img, fit);
    const detachReveal = revealOnView ? attachReveal(frame, img) : undefined;
    return () => {
      detachParallax();
      detachReveal?.();
    };
  }, [revealOnView, fit]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={className}
    />
  );
}
