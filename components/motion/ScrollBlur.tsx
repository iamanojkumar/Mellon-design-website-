"use client";

import { useEffect, useRef } from "react";
import { getSettings, subscribeSettings } from "@/lib/motion-settings";
import styles from "./ScrollBlur.module.css";

/**
 * Scroll-driven blur, all click-through backdrop-filter layers:
 *  - a progressive blur band along the bottom edge, and
 *  - a vertical-only motion blur in that same bottom band while scrolling.
 * Both exist only while scrolling: they fade in when it starts and fade out when it
 * stops. Nothing here touches the top of the page.
 * Skipped for reduced-motion and touch: backdrop blur over a full viewport is heavy.
 */

// Each layer is shorter and blurrier than the last, giving a progressive ramp.
const LAYERS = [
  { height: 1, blur: 0.3 },
  { height: 0.62, blur: 0.6 },
  { height: 0.32, blur: 1 },
];

const FILTER_ID = "scroll-motion-filter";

export function ScrollBlur() {
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const motionRef = useRef<HTMLDivElement>(null);
  const blurRef = useRef<SVGFEGaussianBlurElement>(null);

  useEffect(() => {
    const motion = motionRef.current;
    const blurEl = blurRef.current;
    const layers = layerRefs.current.filter((l): l is HTMLDivElement => !!l);
    if (!motion || !blurEl || layers.length !== LAYERS.length) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ) {
      return;
    }

    // A vertical-only blur needs an SVG filter, which only Chromium accepts in
    // backdrop-filter; other browsers fall back to a plain (softer) blur.
    const svgFilter = CSS.supports("backdrop-filter", `url(#${FILTER_ID})`);
    const setBackdrop = (el: HTMLElement, value: string) => {
      el.style.setProperty("backdrop-filter", value);
      el.style.setProperty("-webkit-backdrop-filter", value);
    };
    if (svgFilter) setBackdrop(motion, `url(#${FILTER_ID})`);

    let cfg = getSettings();
    let lastY = window.scrollY;
    let speed = 0; // smoothed scroll speed, px/frame
    let norm = 0; // 0..1 from speed
    let presence = 0; // 0..1 fade envelope: rises while scrolling, falls when it stops
    let lastT = 0;
    let raf = 0;
    let running = false;

    const hideAll = () => {
      layers.forEach((l) => (l.style.visibility = "hidden"));
      motion.style.visibility = "hidden";
    };

    const apply = () => {
      // The only hard switch: fully faded out (or disabled). Everything else changes
      // continuously, so there is no threshold for jitter to flip on and off.
      if (!cfg.scrollBlurEnabled || presence < 0.02) {
        hideAll();
        return;
      }
      // Even a slow scroll shows the effect (0.4 floor); faster scrolling strengthens it.
      const strength = presence * (0.4 + 0.6 * norm);
      const bottom = cfg.scrollBlurBottom * strength;
      const opacity = presence.toFixed(3);
      layers.forEach((layer, i) => {
        layer.style.visibility = "visible";
        layer.style.opacity = opacity;
        layer.style.height = `${cfg.scrollBlurHeight * LAYERS[i].height}vh`;
        setBackdrop(layer, `blur(${(bottom * LAYERS[i].blur).toFixed(2)}px)`);
      });

      const py = cfg.scrollBlurMotion * norm * presence;
      motion.style.visibility = "visible";
      motion.style.opacity = opacity;
      motion.style.height = `${cfg.scrollBlurHeight}vh`;
      if (svgFilter) blurEl.setAttribute("stdDeviation", `0 ${py.toFixed(2)}`);
      else setBackdrop(motion, `blur(${(py * 0.6).toFixed(2)}px)`);
    };

    const tick = (now: number) => {
      const dt = lastT ? Math.min(now - lastT, 50) : 16;
      lastT = now;
      const y = window.scrollY;
      const dy = Math.abs(y - lastY);
      lastY = y;
      // ~90ms average of scroll speed, then a soft curve so ordinary wheel scrolling
      // already shows the effect while flicks don't overshoot.
      speed += (dy * (16.67 / dt) - speed) * (1 - Math.exp(-dt / 90));
      norm = Math.min(1, speed / 30) ** 0.7;
      // Fade envelope. The target follows the smoothed speed continuously (0 below ~1 px/frame,
      // 1 above ~4), so there is no scrolling/not-scrolling flag to flicker at the end of a
      // glide, and the slow tail of the smooth scroll can never re-trigger the effect.
      const t = Math.min(1, Math.max(0, (speed - 1) / 3));
      const target = t * t * (3 - 2 * t);
      // Attack when rising toward the target, release when falling: one direction at a time.
      const tau = target > presence ? cfg.scrollBlurFadeIn : cfg.scrollBlurFadeOut;
      presence += (target - presence) * (1 - Math.exp(-dt / Math.max(tau, 1)));
      apply();
      if (presence > 0.005 || dy > 0) {
        raf = requestAnimationFrame(tick);
      } else {
        running = false;
        lastT = 0;
        presence = 0;
        norm = 0;
        apply();
      }
    };

    const onScroll = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };

    const unsubscribe = subscribeSettings(() => {
      cfg = getSettings();
      apply();
    });
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      unsubscribe();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <>
      <svg className={styles.svgDefs} aria-hidden="true" focusable="false">
        <filter
          id={FILTER_ID}
          x="0"
          y="0"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur ref={blurRef} in="SourceGraphic" stdDeviation="0 0" />
        </filter>
      </svg>
      <div ref={motionRef} className={styles.motion} aria-hidden="true" />
      {LAYERS.map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            layerRefs.current[i] = el;
          }}
          className={styles.bottom}
          aria-hidden="true"
        />
      ))}
    </>
  );
}
