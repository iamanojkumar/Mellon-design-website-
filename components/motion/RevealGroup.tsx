"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePageReady } from "@/lib/page-transition";
import styles from "./RevealGroup.module.css";

/**
 * A group of cards that rise in one after another when the group scrolls into
 * view: the first card moves up from below while fading in, and each following
 * card starts a beat after the one before it (children are staggered by DOM
 * order; the CSS covers the first 12, later ones share the last delay).
 *
 * Render the grid/list itself with this so layout is unchanged; pass the same
 * className the plain element had. Off under prefers-reduced-motion, and shown
 * as-is when scripting is unavailable.
 */
export function RevealGroup({
  as: Tag = "div",
  className,
  children,
}: {
  as?: "div" | "ul" | "ol";
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const pageReady = usePageReady();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setInView(true);
        observer.disconnect();
      },
      { rootMargin: "0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={[className, styles.group].filter(Boolean).join(" ")}
      data-in={inView && pageReady ? "" : undefined}
    >
      {children}
    </Tag>
  );
}
