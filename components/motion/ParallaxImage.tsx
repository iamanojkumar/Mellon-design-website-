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
 * Skipped for reduced-motion, where it simply renders a static image.
 */

type Entry = {
  frame: HTMLElement;
  img: HTMLImageElement;
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

    const shift = entry.current * parallaxStrength * rect.height;
    const scale = 1 + 2 * parallaxStrength;
    entry.img.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
  }

  raf = active.size > 0 ? requestAnimationFrame(tick) : 0;
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
export function attachParallax(frame: HTMLElement, img: HTMLImageElement): () => void {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let entry: Entry | null = null;

  const attach = () => {
    if (entry || !getSettings().parallaxEnabled || reduced.matches) return;
    entry = { frame, img, current: 0, target: 0 };
    registry.set(frame, entry);
    getObserver().observe(frame);
  };

  const detach = () => {
    if (!entry) return;
    getObserver().unobserve(frame);
    active.delete(entry);
    registry.delete(frame);
    entry = null;
    // Hand the image back exactly as it was, so a disabled effect leaves no
    // residual transform behind.
    img.style.transform = "";
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
}) {
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = ref.current;
    const frame = img?.parentElement;
    if (!img || !frame) return;
    const detachParallax = attachParallax(frame, img);
    const detachReveal = revealOnView ? attachReveal(frame, img) : undefined;
    return () => {
      detachParallax();
      detachReveal?.();
    };
  }, [revealOnView]);

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
