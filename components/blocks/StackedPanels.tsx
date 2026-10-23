"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

const GAP = 16; // px between whatever the panels stick below and the first panel
const HEADER_SLIDE_MS = 450; // the site header's hide/show transition, plus a margin

/** Bottom edge of the sticky site header on screen (0 while it is slid away). */
function headerBottom(): number {
  const header = document.querySelector<HTMLElement>("header");
  if (!header || getComputedStyle(header).position !== "sticky") return 0;
  return Math.max(0, header.getBoundingClientRect().bottom);
}

/**
 * Stacks elements as sticky panels that slide over each other on scroll. The
 * panels are the wrapper's children by default, or whatever `selector` picks
 * inside it (e.g. the cards of a grid). Each panel gets `--stick` (its sticky
 * top) and `--depth` (how many panels now cover it, 0..n, eased by scroll),
 * which the CSS turns into a smaller, tilted card, so the panel at the back is
 * the narrowest and the front one the widest. A panel taller than the screen
 * sticks by its bottom edge instead, so it is read in full first.
 *
 * Positions follow the site header as it slides away and back. With
 * `belowPrevious`, the panels also stick below the wrapper's previous sibling
 * (a group heading), and the shared parent gets `--sticky-top` so the CSS can
 * pin that heading under the header.
 *
 * Stacking (`data-stacked` on the wrapper) is on only while `media` matches and
 * reduced motion is off; otherwise the panels stay in normal flow.
 */
export function StackedPanels({
  className,
  children,
  media = "all",
  selector = ":scope > *",
  step = 24,
  belowPrevious = false,
}: {
  className?: string;
  children: ReactNode;
  /** Media query the stacking is limited to. */
  media?: string;
  /** Which elements inside the wrapper are the panels. */
  selector?: string;
  /** px each later panel sticks below the one before it. */
  step?: number;
  /** Stick below the wrapper's previous sibling (a sticky heading) too. */
  belowPrevious?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const all = Array.from(root.querySelectorAll<HTMLElement>(selector));
    const heading = belowPrevious ? (root.previousElementSibling as HTMLElement | null) : null;
    const query = window.matchMedia(`${media} and (prefers-reduced-motion: no-preference)`);
    let panels: HTMLElement[] = [];
    let heights: number[] = [];
    let headingHeight = 0;
    let enabled = false;
    let raf = 0;

    const measure = () => {
      // Panels hidden at this screen size (display: none) take no part.
      panels = all.filter((panel) => panel.getClientRects().length > 0);
      heights = panels.map((panel) => panel.offsetHeight);
      headingHeight = heading?.getClientRects().length ? heading.offsetHeight : 0;
      enabled = query.matches && panels.length > 1;
      root.toggleAttribute("data-stacked", enabled);
      if (!enabled) all.forEach((panel) => panel.style.removeProperty("--depth"));
      update();
    };

    const update = () => {
      raf = 0;
      const header = headerBottom();
      if (heading) root.parentElement?.style.setProperty("--sticky-top", `${header}px`);
      if (!enabled) return;
      const top = header + headingHeight + GAP;
      const sticks = panels.map((panel, i) => {
        const wanted = top + i * step;
        // A panel taller than the screen sticks once its bottom edge is on
        // screen, so all of it has been seen before the next one covers it.
        const stick = Math.min(wanted, window.innerHeight - heights[i] - GAP);
        panel.style.setProperty("--stick", `${stick}px`);
        // Shrink around the line where the panel's visible part starts.
        panel.style.setProperty("--origin-y", `${wanted - stick}px`);
        return stick;
      });
      // How far each panel has slid over the one before it, 0..1: 0 until it
      // starts to overlap that panel, 1 once it is stuck in place.
      const progress = panels.map((panel, i) => {
        if (i === 0) return 0;
        const range = Math.max(1, sticks[i - 1] + heights[i - 1] - sticks[i]);
        const distance = panel.getBoundingClientRect().top - sticks[i];
        return Math.min(1, Math.max(0, 1 - distance / range));
      });
      panels.forEach((panel, i) => {
        let depth = 0;
        for (let j = i + 1; j < panels.length; j++) depth += progress[j];
        panel.style.setProperty("--depth", depth.toFixed(3));
      });
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    // Follow the header frame by frame while it slides away or back.
    let follow = 0;
    const followHeader = () => {
      const until = performance.now() + HEADER_SLIDE_MS;
      cancelAnimationFrame(follow);
      const loop = () => {
        update();
        if (performance.now() < until) follow = requestAnimationFrame(loop);
      };
      follow = requestAnimationFrame(loop);
    };
    const header = document.querySelector("header");
    const headerWatch = new MutationObserver(followHeader);
    if (header) headerWatch.observe(header, { attributes: true, attributeFilter: ["data-hidden"] });

    measure();
    const resize = new ResizeObserver(measure);
    all.forEach((panel) => resize.observe(panel));
    if (heading) resize.observe(heading);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", onScroll, { passive: true });
    query.addEventListener("change", measure);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(follow);
      headerWatch.disconnect();
      resize.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", onScroll);
      query.removeEventListener("change", measure);
    };
  }, [media, selector, step, belowPrevious]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
