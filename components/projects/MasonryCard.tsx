"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { GalleryImage } from "@/lib/project-gallery";
import { registerSlideshow } from "./slideshow";
import styles from "./Masonry.module.css";

export type MasonryLabels = {
  /** "Image {current} of {total}" */
  slide: string;
  previous: string;
  next: string;
};

/** Used when an image's size is unknown (e.g. a pasted URL that never loaded in the admin). */
const FALLBACK_RATIO = "4 / 5";
/** Length of one slide, auto or clicked. */
const SLIDE_MS = 900;
/** How long a touch keeps the tile out of the auto-slide queue. */
const TOUCH_PAUSE_MS = 4000;

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/**
 * One tile of the masonry wall used for image-led services (branding, graphic,
 * motion): the image at its own proportions and a short title, nothing else.
 *
 * A project with several images becomes a slider: the strip scrolls sideways
 * (swipe, trackpad, or the arrows and dots), snapping one image at a time, and
 * slides on its own through the page-wide queue in ./slideshow.ts, which moves
 * one tile at a time in reading order. The tile keeps the first image's
 * proportions so the wall does not jump.
 *
 * Slides are an eased scroll animation (snap is lifted while it runs, so the
 * browser does not fight it). A copy of the first image sits after the last:
 * going "next" from the last image slides onto the copy and then quietly resets
 * to the real first, so the loop always moves forward instead of rewinding.
 *
 * The title is the link that names the card for keyboards and screen readers;
 * the image strip is a second, mouse-only link to the same page, hidden from
 * assistive tech so each card is announced once. The arrows and dots sit
 * beside that link, not inside it, because a button inside a link is invalid.
 */
export function MasonryCard({
  locale,
  project,
  labels,
}: {
  locale: string;
  project: { slug: string; title: string; images: GalleryImage[] };
  labels: MasonryLabels;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLAnchorElement>(null);
  const animating = useRef(false);
  const [current, setCurrent] = useState(0);
  // Images after the first load only once the tile is near the screen, and
  // then eagerly, so a slide never reveals a half-loaded image.
  const [warm, setWarm] = useState(false);
  const href = `/${locale}/projects/${project.slug}`;
  const { images } = project;
  const count = images.length;
  const first = images[0];
  const ratio = first?.width && first?.height ? `${first.width} / ${first.height}` : FALLBACK_RATIO;
  const multiple = count > 1;

  /** Eased scroll to slide `target` (0..count, where count is the copy of the first). */
  function slideTo(target: number): Promise<void> {
    const track = trackRef.current;
    if (!track || animating.current) return Promise.resolve();
    const width = track.clientWidth;
    const from = track.scrollLeft;
    const to = target * width;
    if (Math.abs(to - from) < 1) return Promise.resolve();

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    animating.current = true;
    track.style.scrollSnapType = "none";
    const finish = () => {
      if (target >= count) track.scrollLeft = 0;
      track.style.scrollSnapType = "";
      animating.current = false;
      setCurrent(target % count);
    };

    if (reduce) {
      track.scrollLeft = to;
      finish();
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min((now - start) / SLIDE_MS, 1);
        track.scrollLeft = from + (to - from) * easeInOutCubic(t);
        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          finish();
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }

  function goTo(index: number) {
    const track = trackRef.current;
    if (!track || animating.current) return;
    if (index >= count) return void slideTo(count);
    if (index < 0) {
      // Back from the first: jump to the copy (it looks identical) and slide
      // back from there onto the last image.
      track.style.scrollSnapType = "none";
      track.scrollLeft = count * track.clientWidth;
      return void slideTo(count - 1);
    }
    void slideTo(index);
  }

  // Join the page-wide auto-slide queue.
  const advanceRef = useRef<() => Promise<void>>(() => Promise.resolve());
  useEffect(() => {
    advanceRef.current = () => slideTo(current + 1);
  });

  useEffect(() => {
    const card = cardRef.current;
    if (!card || !multiple) return;

    const warmObserver = new IntersectionObserver(
      ([record]) => {
        if (!record.isIntersecting) return;
        setWarm(true);
        warmObserver.disconnect();
      },
      { rootMargin: "300px" },
    );
    warmObserver.observe(card);

    const slideshow = registerSlideshow(card, () => advanceRef.current());
    let hovering = false;
    let focused = false;
    let touchTimer: ReturnType<typeof setTimeout> | null = null;
    const sync = () => slideshow.setPaused(hovering || focused || touchTimer !== null);

    const onEnter = (event: PointerEvent) => {
      if (event.pointerType === "mouse") {
        hovering = true;
        sync();
      }
    };
    const onLeave = () => {
      hovering = false;
      sync();
    };
    const onTouch = () => {
      if (touchTimer) clearTimeout(touchTimer);
      touchTimer = setTimeout(() => {
        touchTimer = null;
        sync();
      }, TOUCH_PAUSE_MS);
      sync();
    };
    const onFocusIn = () => {
      focused = true;
      sync();
    };
    const onFocusOut = () => {
      focused = false;
      sync();
    };

    card.addEventListener("pointerenter", onEnter);
    card.addEventListener("pointerleave", onLeave);
    card.addEventListener("touchstart", onTouch, { passive: true });
    card.addEventListener("focusin", onFocusIn);
    card.addEventListener("focusout", onFocusOut);
    return () => {
      warmObserver.disconnect();
      slideshow.unregister();
      if (touchTimer) clearTimeout(touchTimer);
      card.removeEventListener("pointerenter", onEnter);
      card.removeEventListener("pointerleave", onLeave);
      card.removeEventListener("touchstart", onTouch);
      card.removeEventListener("focusin", onFocusIn);
      card.removeEventListener("focusout", onFocusOut);
    };
  }, [multiple]);

  // The strip plus, for a slider, the copy of the first image at the end.
  const slides = multiple ? [...images, images[0]] : images;

  return (
    <article ref={cardRef} className={styles.card}>
      {first && (
        <div className={styles.media} style={{ aspectRatio: ratio }}>
          <Link
            ref={trackRef}
            href={href}
            className={styles.track}
            tabIndex={-1}
            aria-hidden="true"
            draggable={false}
            onScroll={(event) => {
              if (animating.current) return;
              const track = event.currentTarget;
              const index = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
              // A swipe that settles on the copy is the first image: reset to it.
              if (multiple && index >= count && track.scrollLeft >= count * track.clientWidth - 1) {
                track.scrollLeft = 0;
              }
              setCurrent(index % count);
            }}
          >
            {slides.map((image, index) => (
              // Plain <img>: project media is already AVIF from the admin
              // pipeline (see ProjectCard), so next/image would re-encode it.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={index === count ? "loop-copy" : `${image.src}-${index}`}
                className={styles.slide}
                src={image.src}
                alt=""
                width={image.width ?? undefined}
                height={image.height ?? undefined}
                loading={index === 0 || !warm ? "lazy" : "eager"}
                decoding="async"
                draggable={false}
              />
            ))}
          </Link>

          {multiple && (
            <>
              <button
                type="button"
                className={`${styles.arrow} ${styles.arrowPrev}`}
                aria-label={`${labels.previous}: ${project.title}`}
                onClick={() => goTo(current - 1)}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                className={`${styles.arrow} ${styles.arrowNext}`}
                aria-label={`${labels.next}: ${project.title}`}
                onClick={() => goTo(current + 1)}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
              <div className={styles.dots}>
                {images.map((image, index) => (
                  <button
                    key={`${image.src}-${index}`}
                    type="button"
                    className={styles.dot}
                    aria-current={index === current ? "true" : undefined}
                    aria-label={labels.slide
                      .replace("{current}", String(index + 1))
                      .replace("{total}", String(count))}
                    onClick={() => goTo(index)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
      <h3 className={styles.title}>
        <Link href={href}>{project.title}</Link>
      </h3>
    </article>
  );
}
