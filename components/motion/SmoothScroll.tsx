"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import {
  getServerSettings,
  getSettings,
  subscribeSettings,
} from "@/lib/motion-settings";

/** Site-wide inertial smooth scroll (Lenis). Tunable live via the debug panel. */
export function SmoothScroll() {
  const s = useSyncExternalStore(subscribeSettings, getSettings, getServerSettings);
  const lenisRef = useRef<Lenis | null>(null);
  const latest = useRef(s);
  latest.current = s;

  useEffect(() => {
    if (
      !s.scrollEnabled ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const lenis = new Lenis({
      lerp: latest.current.scrollLerp,
      wheelMultiplier: latest.current.scrollWheelMultiplier,
      anchors: true,
    });
    lenisRef.current = lenis;
    let raf = requestAnimationFrame(function loop(time) {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    });
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [s.scrollEnabled]);

  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    lenis.options.lerp = s.scrollLerp;
    lenis.options.wheelMultiplier = s.scrollWheelMultiplier;
  }, [s.scrollLerp, s.scrollWheelMultiplier]);

  return null;
}
