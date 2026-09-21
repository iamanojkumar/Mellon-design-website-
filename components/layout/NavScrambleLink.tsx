"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { getSettings } from "@/lib/motion-settings";

// Extra glyphs mixed into the scramble. The rest of the pool comes from the label itself,
// so any script or accented alphabet scrambles with its own characters (no Latin-only set).
const SYMBOLS = "#%&*+=?/<>_~";

/**
 * Nav link that scrambles its text once when hovered (or focused): characters resolve
 * left to right from random glyphs into the real label. The link keeps its real label as
 * its accessible name, the animated text is aria-hidden, and the width is locked while
 * it runs so neighbouring links never shift.
 */
export function NavScrambleLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: string;
}) {
  const textRef = useRef<HTMLSpanElement>(null);
  const running = useRef(false);
  const raf = useRef(0);
  const endTimer = useRef(0);

  const finish = () => {
    cancelAnimationFrame(raf.current);
    window.clearTimeout(endTimer.current);
    const el = textRef.current;
    if (el) {
      el.textContent = children;
      el.style.display = "";
      el.style.width = "";
      el.style.whiteSpace = "";
    }
    running.current = false;
  };

  const run = () => {
    const el = textRef.current;
    if (!el || running.current) return; // once per hover: ignore re-entry until done
    const cfg = getSettings();
    if (!cfg.navScrambleEnabled) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !window.matchMedia("(hover: hover)").matches
    ) {
      return;
    }

    running.current = true;
    const duration = cfg.navScrambleMs;
    const chars = [...children];
    const pool = [...new Set([...children.replace(/\s/g, ""), ...SYMBOLS])];
    const last = Math.max(chars.length - 1, 1);
    // Staggered left-to-right resolve times, all done before `duration`.
    const resolveAt = chars.map(
      (_, i) => duration * 0.2 + (i / last) * duration * 0.55 + Math.random() * duration * 0.15,
    );

    // Lock the width so random glyphs of different widths can't nudge the layout.
    el.style.width = `${el.getBoundingClientRect().width}px`;
    el.style.display = "inline-block";
    el.style.whiteSpace = "nowrap";

    const start = performance.now();
    const frame = (now: number) => {
      const t = now - start;
      el.textContent = chars
        .map((c, i) => (c === " " || t >= resolveAt[i] ? c : pool[Math.floor(Math.random() * pool.length)]))
        .join("");
      if (t < duration) raf.current = requestAnimationFrame(frame);
    };
    raf.current = requestAnimationFrame(frame);
    // Guarantees the real text is restored even if animation frames are throttled.
    endTimer.current = window.setTimeout(finish, duration + 40);
  };

  useEffect(() => () => finish(), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Link href={href} className={className} aria-label={children} onMouseEnter={run} onFocus={run}>
      <span ref={textRef} aria-hidden="true">
        {children}
      </span>
    </Link>
  );
}
