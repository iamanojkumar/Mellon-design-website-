"use client";

import { useEffect, useRef, useState } from "react";
import type { GalleryImage } from "@/lib/project-gallery";
import styles from "./GalleryMarquee.module.css";

export type GalleryMarqueeLabels = {
  /** Accessible name of the scrolling row. */
  images: string;
  pause: string;
  play: string;
};

/** Auto-scroll speed, px per second. Slow enough to look at each image. */
const SPEED = 40;
/** How long after a swipe, wheel or drag the row waits before drifting again. */
const RESUME_AFTER_MS = 2500;
/** Pointer travel that turns a press into a drag (and cancels the click). */
const DRAG_THRESHOLD = 6;

/**
 * Hero of an image-only project: every image in one horizontal row, at the same
 * height and their own widths.
 *
 * When the row is wider than the screen it becomes a marquee: it drifts left on
 * its own and loops, and stays a normal scroller the visitor can swipe, wheel
 * sideways, drag with a mouse or move with the arrow keys. Any of those pauses
 * the drift for a moment, hovering or focusing it pauses it, and a pause button
 * stops it for good (moving content needs one). The loop is a second copy of
 * the images, hidden from assistive tech and from the full-screen viewer.
 *
 * The row starts at the content's left edge, in line with the title below. A
 * row that fits the screen never moves; neither does anything under
 * prefers-reduced-motion. Without script it is a plain
 * horizontal scroller.
 */
export function GalleryMarquee({
  images,
  labels,
}: {
  images: GalleryImage[];
  labels: GalleryMarqueeLabels;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLUListElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [paused, setPaused] = useState(false);
  // Read by the animation loop, which must not restart on every toggle.
  const pausedRef = useRef(false);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const loop = overflows && !reduceMotion;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Does one set of images overflow the screen? Measured on the first set
  // only, so the loop copy never makes the answer stick at "yes".
  useEffect(() => {
    const scroller = scrollerRef.current;
    const row = rowRef.current;
    if (!scroller || !row) return;
    const measure = () => {
      const items = Array.from(row.children).slice(0, images.length) as HTMLElement[];
      const last = items[items.length - 1];
      if (!last) return;
      const setWidth = last.offsetLeft + last.offsetWidth - items[0].offsetLeft;
      setOverflows(setWidth > scroller.clientWidth + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    observer.observe(row);
    return () => observer.disconnect();
  }, [images.length]);

  // The drift, plus wrapping the visitor's own scrolling round the loop.
  useEffect(() => {
    const scroller = scrollerRef.current;
    const row = rowRef.current;
    if (!loop || !scroller || !row) return;

    /** Width of one set including the gap after it: where the copy starts. */
    const period = () => {
      const copyStart = row.children[images.length] as HTMLElement | undefined;
      return copyStart ? copyStart.offsetLeft - (row.children[0] as HTMLElement).offsetLeft : 0;
    };

    let hovering = false;
    let focused = false;
    let idleUntil = 0;
    let position = scroller.scrollLeft;
    let last = performance.now();
    let frame = 0;

    const wrap = () => {
      const p = period();
      if (p <= 0) return;
      if (scroller.scrollLeft >= p) {
        scroller.scrollLeft -= p;
      } else if (scroller.scrollLeft <= 0 && performance.now() < idleUntil) {
        // Scrolling back past the start continues into the end of the copy.
        scroller.scrollLeft += p;
      }
    };

    const tick = (now: number) => {
      // Capped so a frame after a background tab doesn't leap, but loose
      // enough that a throttled (low-fps) window still drifts at full speed.
      const dt = Math.min(now - last, 120) / 1000;
      last = now;
      const drifting = !pausedRef.current && !hovering && !focused && now >= idleUntil;
      if (drifting) {
        // A float accumulator: scrollLeft may round, and a slow drift would stall.
        position += SPEED * dt;
        const p = period();
        if (p > 0 && position >= p) position -= p;
        scroller.scrollLeft = position;
      } else {
        position = scroller.scrollLeft;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const nudge = () => {
      idleUntil = performance.now() + RESUME_AFTER_MS;
    };
    const onScroll = () => {
      if (performance.now() < idleUntil) wrap();
    };
    const onEnter = (event: PointerEvent) => {
      if (event.pointerType === "mouse") hovering = true;
    };
    const onLeave = () => {
      hovering = false;
    };
    const onFocusIn = () => {
      focused = true;
    };
    const onFocusOut = () => {
      focused = false;
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    scroller.addEventListener("wheel", nudge, { passive: true });
    scroller.addEventListener("touchstart", nudge, { passive: true });
    scroller.addEventListener("pointerdown", nudge);
    scroller.addEventListener("keydown", nudge);
    scroller.addEventListener("pointerenter", onEnter);
    scroller.addEventListener("pointerleave", onLeave);
    scroller.addEventListener("focusin", onFocusIn);
    scroller.addEventListener("focusout", onFocusOut);
    return () => {
      cancelAnimationFrame(frame);
      scroller.removeEventListener("scroll", onScroll);
      scroller.removeEventListener("wheel", nudge);
      scroller.removeEventListener("touchstart", nudge);
      scroller.removeEventListener("pointerdown", nudge);
      scroller.removeEventListener("keydown", nudge);
      scroller.removeEventListener("pointerenter", onEnter);
      scroller.removeEventListener("pointerleave", onLeave);
      scroller.removeEventListener("focusin", onFocusIn);
      scroller.removeEventListener("focusout", onFocusOut);
    };
  }, [loop, images.length]);

  // Mouse drag to scroll. Touch and trackpads scroll natively already. A drag
  // swallows the click that ends it, so it never opens the full-screen viewer.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !overflows) return;
    let start: { x: number; left: number } | null = null;
    let dragged = false;

    const onDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      start = { x: event.clientX, left: scroller.scrollLeft };
      dragged = false;
    };
    const onMove = (event: PointerEvent) => {
      if (!start) return;
      const dx = event.clientX - start.x;
      if (!dragged && Math.abs(dx) < DRAG_THRESHOLD) return;
      if (!dragged) {
        dragged = true;
        scroller.setPointerCapture(event.pointerId);
        scroller.dataset.dragging = "";
      }
      scroller.scrollLeft = start.left - dx;
    };
    const onUp = () => {
      start = null;
      delete scroller.dataset.dragging;
    };
    const onClick = (event: MouseEvent) => {
      if (!dragged) return;
      dragged = false;
      event.preventDefault();
      event.stopPropagation();
    };

    scroller.addEventListener("pointerdown", onDown);
    scroller.addEventListener("pointermove", onMove);
    scroller.addEventListener("pointerup", onUp);
    scroller.addEventListener("pointercancel", onUp);
    scroller.addEventListener("click", onClick, true);
    return () => {
      scroller.removeEventListener("pointerdown", onDown);
      scroller.removeEventListener("pointermove", onMove);
      scroller.removeEventListener("pointerup", onUp);
      scroller.removeEventListener("pointercancel", onUp);
      scroller.removeEventListener("click", onClick, true);
    };
  }, [overflows]);

  const renderImage = (image: GalleryImage, index: number, copy: boolean) => (
    <li
      key={`${copy ? "copy" : "main"}-${index}`}
      className={styles.item}
      aria-hidden={copy ? "true" : undefined}
      data-lightbox-ignore={copy ? "" : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={styles.image}
        src={image.src}
        alt={copy ? "" : image.alt}
        width={image.width ?? undefined}
        height={image.height ?? undefined}
        style={image.width && image.height ? undefined : { aspectRatio: "4 / 5" }}
        // The first images are the LCP candidates; the rest can wait.
        loading={index < 3 && !copy ? "eager" : "lazy"}
        fetchPriority={index === 0 && !copy ? "high" : undefined}
        decoding="async"
        draggable={false}
      />
    </li>
  );

  return (
    <div className={styles.root} data-overflows={overflows ? "" : undefined}>
      <div
        ref={scrollerRef}
        className={styles.scroller}
        role="region"
        aria-label={labels.images}
        tabIndex={overflows ? 0 : undefined}
      >
        <ul ref={rowRef} className={styles.row}>
          {images.map((image, index) => renderImage(image, index, false))}
          {loop && images.map((image, index) => renderImage(image, index, true))}
        </ul>
      </div>
      {loop && (
        <button
          type="button"
          className={styles.pause}
          aria-pressed={paused}
          aria-label={paused ? labels.play : labels.pause}
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? (
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="currentColor">
              <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
