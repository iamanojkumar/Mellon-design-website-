"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import styles from "./HeroSequence.module.css";

/**
 * Plays a page-load intro in order: step 0 (headline), step 1 (subtext), step 2
 * (buttons fade in). Each piece waits until every earlier step has reported
 * that it finished, so the hand-off follows the real duration even though the
 * number of lines is only known once the text has been measured in the browser.
 *
 * Outside a provider the stage is Infinity, so SwiftUpText / FadeIn simply play
 * straight away.
 */
type Sequence = { stage: number; complete: (step: number) => void };

const SequenceContext = createContext<Sequence>({ stage: Infinity, complete: () => {} });

export function useSequence() {
  return useContext(SequenceContext);
}

export function HeroSequence({ children }: { children: ReactNode }) {
  const [stage, setStage] = useState(0);
  const complete = useCallback((step: number) => setStage((s) => Math.max(s, step + 1)), []);
  const value = useMemo(() => ({ stage, complete }), [stage, complete]);
  return <SequenceContext.Provider value={value}>{children}</SequenceContext.Provider>;
}

/**
 * Fades (and lifts slightly) into view once the sequence reaches `step`, and,
 * with `whenVisible`, once it has scrolled into view. `delay` (seconds) offsets
 * the fade, e.g. to stagger a row of tags.
 */
export function FadeIn({
  step = 0,
  whenVisible = false,
  delay = 0,
  as: Tag = "div",
  className,
  children,
}: {
  step?: number;
  whenVisible?: boolean;
  delay?: number;
  as?: "div" | "span";
  className?: string;
  children: ReactNode;
}) {
  const { stage } = useSequence();
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(!whenVisible);

  useEffect(() => {
    const el = ref.current;
    if (!whenVisible || !el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { rootMargin: "0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [whenVisible]);

  const shown = stage >= step && visible;
  // The timed fallback only suits content that shows on load, not scroll-triggered.
  const state = shown ? styles.in : whenVisible ? styles.out : `${styles.out} ${styles.timed}`;
  return (
    <Tag
      ref={ref as never}
      className={[className, state].filter(Boolean).join(" ")}
      style={delay ? ({ transitionDelay: `${delay}s` } as CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}
