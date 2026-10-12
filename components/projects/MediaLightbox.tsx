"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./MediaLightbox.module.css";

export type LightboxLabels = {
  /** Button on each image; the image's alt text is appended for screen readers. */
  open: string;
  close: string;
  previous: string;
  next: string;
  /** "{current} of {total}" */
  counter: string;
  /** Accessible name of the full-screen viewer. */
  dialog: string;
  /** Accessible name of the thumbnail strip. */
  thumbnails: string;
};

type Item = {
  kind: "image" | "video";
  src: string;
  /** Video: still frame for the thumbnail. */
  poster: string;
  alt: string;
  caption: string;
  /** Taller than twice its width: shown at full width and scrolled, not shrunk to fit. */
  tall: boolean;
};

/** Images and GIF-style loop videos; videos with controls are left to their own player. */
const ELIGIBLE = "img, video[data-loop]";

function collect(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(ELIGIBLE)).filter(
    (el) => !el.closest("a, button, [data-lightbox-ignore]"),
  );
}

function toItem(el: HTMLElement): Item {
  const caption = el.closest("figure")?.querySelector("figcaption")?.textContent?.trim() ?? "";
  if (el instanceof HTMLVideoElement) {
    const src = el.currentSrc || el.querySelector("source")?.src || el.src;
    const ratio = (el.videoHeight || el.height) / (el.videoWidth || el.width || 1);
    return { kind: "video", src, poster: el.poster, alt: el.getAttribute("aria-label") ?? "", caption, tall: ratio > 2 };
  }
  const img = el as HTMLImageElement;
  const ratio = (img.naturalHeight || img.height) / (img.naturalWidth || img.width || 1);
  return { kind: "image", src: img.currentSrc || img.src, poster: img.currentSrc || img.src, alt: img.alt, caption, tall: ratio > 2 };
}

/**
 * Full-screen viewer for every image (and GIF-style loop video) inside the
 * nearest `[data-lightbox]` ancestor: click an image, or its expand button, to
 * open it; arrows, keys, swipes and a thumbnail strip move through the rest.
 *
 * It works on whatever is in the DOM when opened, so it covers React-rendered
 * images and editor-authored HTML alike without either knowing about it.
 * Built on <dialog>.showModal(), which traps focus, makes the page behind inert
 * and closes on Escape natively.
 */
export function MediaLightbox({ labels }: { labels: LightboxLabels }) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const swipeRef = useRef<{ x: number; y: number } | null>(null);
  /** Set by a swipe so the click that follows it doesn't count as a backdrop click. */
  const swipedRef = useRef(false);
  const [items, setItems] = useState<Item[]>([]);
  const [index, setIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setMounted(true);
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const openAt = useCallback((el: HTMLElement, opener: HTMLElement) => {
    const root = anchorRef.current?.closest<HTMLElement>("[data-lightbox]");
    if (!root) return;
    const media = collect(root);
    const at = media.indexOf(el);
    if (at < 0) return;
    openerRef.current = opener;
    setItems(media.map(toItem));
    setIndex(at);
  }, []);

  // Wire the page: a click on any eligible image opens the viewer, and each
  // gets a real button so keyboard and screen-reader users can open it too.
  useEffect(() => {
    const root = anchorRef.current?.closest<HTMLElement>("[data-lightbox]");
    if (!root) return;

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const media = target.closest<HTMLElement>(ELIGIBLE);
      if (!media || !root.contains(media) || !collect(root).includes(media)) return;
      event.preventDefault();
      openAt(media, media);
    };
    root.addEventListener("click", onClick);

    const buttons: Array<{ button: HTMLButtonElement; frame: HTMLElement; restorePosition: boolean }> = [];
    for (const media of collect(root)) {
      media.classList.add(styles.zoomable);
      const frame = media.parentElement;
      if (!frame) continue;
      const restorePosition = getComputedStyle(frame).position === "static";
      if (restorePosition) frame.style.position = "relative";
      const button = document.createElement("button");
      button.type = "button";
      button.className = styles.expand;
      const name = media.getAttribute("alt") || media.getAttribute("aria-label");
      button.setAttribute("aria-label", name ? `${labels.open}: ${name}` : labels.open);
      button.innerHTML =
        '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>';
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        openAt(media, button);
      });
      frame.appendChild(button);
      buttons.push({ button, frame, restorePosition });
    }

    return () => {
      root.removeEventListener("click", onClick);
      for (const { button, frame, restorePosition } of buttons) {
        button.remove();
        if (restorePosition) frame.style.position = "";
      }
      root.querySelectorAll(`.${styles.zoomable}`).forEach((el) => el.classList.remove(styles.zoomable));
    };
  }, [labels.open, openAt]);

  const isOpen = index !== null;

  // Open/close the native dialog with the state, and freeze the page behind it.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
      document.documentElement.style.overflow = "hidden";
    }
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen, mounted]);

  /** Idempotent: runs from our own close paths and from the native event. */
  const handleClosed = useCallback(() => {
    document.documentElement.style.overflow = "";
    setIndex((current) => {
      if (current !== null) openerRef.current?.focus({ preventScroll: true });
      return null;
    });
  }, []);

  const closeViewer = useCallback(() => {
    dialogRef.current?.close();
    // The native "close" event is queued and isn't guaranteed to arrive
    // promptly (it didn't at all in a background tab), so don't wait for it.
    handleClosed();
  }, [handleClosed]);

  // Escape closes the dialog natively; this catches that path.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    // A late event from an earlier close must not shut a viewer reopened since.
    const onNativeClose = () => {
      if (!dialog.open) handleClosed();
    };
    dialog.addEventListener("close", onNativeClose);
    return () => dialog.removeEventListener("close", onNativeClose);
  }, [mounted, handleClosed]);

  const go = useCallback(
    (step: number) => setIndex((current) => (current === null ? null : (current + step + items.length) % items.length)),
    [items.length],
  );

  // Keep the active thumbnail in view and warm the neighbors.
  useEffect(() => {
    if (index === null) return;
    const strip = stripRef.current;
    const thumb = strip?.children[index] as HTMLElement | undefined;
    thumb?.scrollIntoView({ block: "nearest", inline: "center", behavior: reduceMotion ? "auto" : "smooth" });
    for (const step of [1, -1]) {
      const neighbor = items[(index + step + items.length) % items.length];
      if (neighbor?.kind === "image") new Image().src = neighbor.src;
    }
  }, [index, items, reduceMotion]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      setIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setIndex(items.length - 1);
    }
  };

  const onPointerDown = (event: React.PointerEvent) => {
    if (event.pointerType !== "mouse") swipeRef.current = { x: event.clientX, y: event.clientY };
  };
  const onPointerUp = (event: React.PointerEvent) => {
    const start = swipeRef.current;
    swipeRef.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      swipedRef.current = true;
      go(dx < 0 ? 1 : -1);
    }
  };

  const current = index !== null ? items[index] : null;

  const dialog = (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-label={labels.dialog}
      onKeyDown={onKeyDown}
      // Wheel and touch scrolling inside belong to the viewer, not Lenis.
      data-lenis-prevent=""
      // A click on the dark backdrop (not the media or controls) closes.
      onClick={(event) => {
        if (swipedRef.current) {
          swipedRef.current = false;
          return;
        }
        if (event.target === event.currentTarget || (event.target as HTMLElement).dataset.backdrop !== undefined) {
          closeViewer();
        }
      }}
    >
      {current && index !== null && (
        <>
          <div className={styles.topBar}>
            <span className={styles.counter} aria-live="polite">
              {labels.counter.replace("{current}", String(index + 1)).replace("{total}", String(items.length))}
            </span>
            <button type="button" className={styles.iconButton} onClick={closeViewer} aria-label={labels.close} autoFocus>
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <div
            className={`${styles.stage} ${current.tall ? styles.stageScroll : ""}`}
            data-backdrop=""
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
          >
            {current.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={current.src}
                src={current.src}
                alt={current.alt}
                className={`${styles.media} ${current.tall ? styles.mediaTall : ""}`}
                decoding="async"
              />
            ) : (
              <video
                key={current.src}
                src={current.src}
                poster={current.poster}
                aria-label={current.alt}
                className={`${styles.media} ${current.tall ? styles.mediaTall : ""}`}
                muted
                loop
                playsInline
                controls
                autoPlay={!reduceMotion}
                controlsList="nodownload"
                disablePictureInPicture
                onContextMenu={(event) => event.preventDefault()}
              />
            )}
          </div>

          {items.length > 1 && (
            <>
              <button type="button" className={`${styles.iconButton} ${styles.prev}`} onClick={() => go(-1)} aria-label={labels.previous}>
                <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button type="button" className={`${styles.iconButton} ${styles.next}`} onClick={() => go(1)} aria-label={labels.next}>
                <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </>
          )}

          <div className={styles.bottom}>
            {current.caption && <p className={styles.caption}>{current.caption}</p>}
            {items.length > 1 && (
              <div
                ref={stripRef}
                className={styles.strip}
                role="group"
                aria-label={labels.thumbnails}
                onWheel={(event) => {
                  // A mouse wheel scrolls the strip sideways.
                  if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) event.currentTarget.scrollLeft += event.deltaY;
                }}
              >
                {items.map((item, i) => (
                  <button
                    key={`${item.src}-${i}`}
                    type="button"
                    className={styles.thumb}
                    aria-current={i === index ? "true" : undefined}
                    aria-label={labels.counter.replace("{current}", String(i + 1)).replace("{total}", String(items.length)) + (item.alt ? `: ${item.alt}` : "")}
                    onClick={() => setIndex(i)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.poster} alt="" loading="lazy" decoding="async" />
                    {item.kind === "video" && <span className={styles.thumbBadge} aria-hidden="true">▶</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </dialog>
  );

  return (
    <>
      <span ref={anchorRef} hidden />
      {mounted && createPortal(dialog, document.body)}
    </>
  );
}
