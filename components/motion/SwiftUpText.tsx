"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { usePageReady } from "@/lib/page-transition";
import { useSequence } from "./HeroSequence";
import styles from "./SwiftUpText.module.css";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

type State = { lines: string[] | null; animate: boolean };

/**
 * Slides a heading up into view one *line* at a time: line 1 first, line 2 a
 * beat later, and so on. Where a line breaks depends on the viewport width and
 * font, so the text is first laid out as plain words, measured, then regrouped
 * into per-line boxes. The words stay real text in the server HTML.
 *
 * - The animation plays once, after fonts load. Later re-wraps (window resize)
 *   regroup the lines without replaying it.
 * - The heading is hidden only until it has been measured; a CSS fallback
 *   reveals it after 2s if JavaScript never runs.
 * - Off under prefers-reduced-motion.
 */
export function SwiftUpText({
  text,
  lineDelay = 0.25,
  step = 0,
  advanceOn = "end",
  whenVisible = false,
  delay = 0,
}: {
  text: string;
  lineDelay?: number;
  /** Position in a surrounding HeroSequence; waits for earlier steps to finish. */
  step?: number;
  /** Report this step done when its animation ends (default) or as soon as it starts. */
  advanceOn?: "end" | "start";
  /** Wait to play until the text scrolls into view (for sections below the fold). */
  whenVisible?: boolean;
  /** Extra seconds before the first line starts. */
  delay?: number;
}) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const readyRef = useRef(false);
  const [state, setState] = useState<State>({ lines: null, animate: true });
  const { stage, complete } = useSequence();
  const pageReady = usePageReady();
  const [visible, setVisible] = useState(!whenVisible);
  const visibleRef = useRef(!whenVisible);

  // Scroll trigger: flip to visible once, when the text first enters the viewport.
  useEffect(() => {
    const root = rootRef.current;
    if (!whenVisible || !root) return;
    if (typeof IntersectionObserver === "undefined") {
      visibleRef.current = true;
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        visibleRef.current = true;
        setVisible(true);
        observer.disconnect();
      },
      { rootMargin: "0px" },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [whenVisible]);

  // Tell the sequence we're done when there is nothing to wait for: the lines
  // were only re-wrapped (no animation), or the visitor prefers reduced motion.
  useEffect(() => {
    if (!state.lines) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!state.animate || (advanceOn === "start" && stage >= step) || (reduced && stage >= step)) {
      complete(step);
    }
  }, [state, stage, step, advanceOn, complete]);

  // Measure: group the plain words by the line they landed on.
  useIsoLayoutEffect(() => {
    if (state.lines !== null || !readyRef.current || !rootRef.current) return;
    const words = Array.from(rootRef.current.querySelectorAll<HTMLElement>("[data-w]"));
    const lines: string[][] = [];
    let lastTop: number | null = null;
    for (const word of words) {
      const top = Math.round(word.offsetTop);
      if (lastTop === null || Math.abs(top - lastTop) > 2) {
        lines.push([]);
        lastTop = top;
      }
      lines[lines.length - 1].push(word.textContent ?? "");
    }
    setState({
      lines: lines.length ? lines.map((line) => line.join(" ")) : [text],
      animate: state.animate,
    });
  }, [state, text]);

  // Wait for fonts (they change where lines break), then start; re-wrap on width changes.
  useEffect(() => {
    let cancelled = false;
    (document.fonts?.ready ?? Promise.resolve()).then(() => {
      if (cancelled) return;
      readyRef.current = true;
      setState((s) => ({ ...s }));
    });

    const root = rootRef.current;
    let lastWidth: number | null = null;
    const observer =
      root && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(([entry]) => {
            const width = Math.round(entry.contentRect.width);
            if (lastWidth !== null && width !== lastWidth) {
              // Re-wrap without replaying, unless it has not been seen yet.
              setState((s) => ({ lines: null, animate: visibleRef.current ? false : s.animate }));
            }
            lastWidth = width;
          })
        : null;
    if (root) observer?.observe(root);

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, []);

  const { lines, animate } = state;

  return (
    <span ref={rootRef} className={lines ? styles.root : `${styles.root} ${styles.pending}`}>
      {lines
        ? lines.map((line, index) => (
            <span key={index} className={styles.clip}>
              <span
                className={
                  !animate ? styles.lineStatic : stage >= step && visible && pageReady ? styles.line : styles.linePending
                }
                style={
                  animate ? ({ animationDelay: `${delay + index * lineDelay}s` } as CSSProperties) : undefined
                }
                onAnimationEnd={
                  advanceOn === "end" && index === lines.length - 1 ? () => complete(step) : undefined
                }
              >
                {line}
              </span>
            </span>
          ))
        : text.split(" ").map((word, index, words) => (
            <span key={index}>
              <span data-w className={styles.measure}>
                {word}
              </span>
              {index < words.length - 1 ? " " : null}
            </span>
          ))}
    </span>
  );
}
