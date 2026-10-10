"use client";

import { useEffect } from "react";
import { normalizeHeroBg } from "@/lib/hero-tint";

/**
 * Publishes a page's hero tint on :root.
 *
 * - `--page-tint` is the hero band's own background (see `.heroBand` in the
 *   project and blog page styles).
 * - `--header-tint` is what the sticky header paints. It starts as the tint so
 *   the first paint is already coloured (no flash), and the effect below swaps
 *   it back to the normal paper colour as soon as the hero band has scrolled
 *   out from under the header — the header only wears the colour while it is
 *   actually sitting over the hero.
 *
 * Renders nothing for a transparent hero, leaving both variables unset. The
 * value is re-validated as #rrggbb because it is written into a style tag.
 */
export function HeroTint({ color }: { color: string | null | undefined }) {
  const tint = normalizeHeroBg(color);

  useEffect(() => {
    if (!tint) return;
    const root = document.documentElement;
    const band = document.querySelector<HTMLElement>("[data-hero-band]");
    const header = document.querySelector<HTMLElement>("header");
    if (!band) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const headerBottom = header?.getBoundingClientRect().bottom ?? 0;
      const overHero = band.getBoundingClientRect().bottom > Math.max(headerBottom, 0);
      if (overHero) root.style.removeProperty("--header-tint");
      else root.style.setProperty("--header-tint", "var(--color-paper)");
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      root.style.removeProperty("--header-tint");
    };
  }, [tint]);

  if (!tint) return null;
  return <style>{`:root{--page-tint:${tint};--header-tint:${tint}}`}</style>;
}
