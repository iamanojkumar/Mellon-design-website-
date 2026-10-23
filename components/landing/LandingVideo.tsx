"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/motion/HeroSequence";
import { SwiftUpText } from "@/components/motion/SwiftUpText";
import styles from "./LandingVideo.module.css";

export type LandingVideoCopy = {
  /** Leave heading, intro and chapters out for the film on its own (e.g. the home page). */
  heading?: string;
  intro?: string;
  /** Accessible name for the video. */
  title: string;
  poster: string;
  /** First match wins, so list the small file with a `media` query first. */
  sources: { src: string; media?: string }[];
  /** `start` is in seconds; each chapter runs until the next one starts. */
  chapters?: { title: string; text: string; start: number }[];
  chaptersLabel?: string;
  pause: string;
  play: string;
};

/**
 * A full-bleed, muted product film that pins while the page scrolls past it:
 * it opens out from an inset frame to the full screen (CSS scroll timeline, so
 * browsers without one simply show it full size). It plays only while on
 * screen, never auto-plays under reduced motion, and the chapter list below it
 * tracks and seeks the film.
 */
export function LandingVideo({
  video,
  overlap = false,
}: {
  video: LandingVideoCopy;
  /** Pull the film up so it sits over the bottom of the section above (the home hero). */
  overlap?: boolean;
}) {
  const chapters = useMemo(() => video.chapters ?? [], [video.chapters]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const chaptersRef = useRef<HTMLOListElement>(null);
  const [paused, setPaused] = useState(true);
  const [active, setActive] = useState(0);
  // Set once the visitor presses pause, so scrolling back doesn't restart it.
  const userPaused = useRef(false);
  const visible = useRef(false);

  const chapterAt = useCallback(
    (time: number) => {
      let index = 0;
      chapters.forEach((chapter, i) => {
        if (time >= chapter.start) index = i;
      });
      return index;
    },
    [chapters],
  );

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) userPaused.current = true;

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible.current = entry.isIntersecting;
        if (entry.isIntersecting && !userPaused.current) el.play().catch(() => {});
        else if (!entry.isIntersecting) el.pause();
      },
      { threshold: 0.25 },
    );
    observer.observe(el);

    const onPlay = () => setPaused(false);
    const onPause = () => setPaused(true);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    return () => {
      observer.disconnect();
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
    };
  }, []);

  // Chapter progress: a CSS variable per frame while playing, so the bars move smoothly.
  useEffect(() => {
    const el = videoRef.current;
    const list = chaptersRef.current;
    if (!el || !list) return;
    let raf = 0;
    const tick = () => {
      const index = chapterAt(el.currentTime);
      const start = chapters[index].start;
      const end = chapters[index + 1]?.start ?? el.duration ?? start + 1;
      const progress = Math.min(1, Math.max(0, (el.currentTime - start) / (end - start || 1)));
      setActive(index);
      list.style.setProperty("--progress", progress.toFixed(3));
      if (!el.paused) raf = requestAnimationFrame(tick);
    };
    tick();
    if (!paused) raf = requestAnimationFrame(tick);
    const onSeeked = () => tick();
    el.addEventListener("seeked", onSeeked);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("seeked", onSeeked);
    };
  }, [paused, chapterAt, chapters]);

  const toggle = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      userPaused.current = false;
      el.play().catch(() => {});
    } else {
      userPaused.current = true;
      el.pause();
    }
  };

  const seek = (index: number) => {
    const el = videoRef.current;
    if (!el) return;
    el.currentTime = chapters[index].start;
    setActive(index);
    if (!userPaused.current) el.play().catch(() => {});
  };

  return (
    <section
      className={overlap ? `${styles.section} ${styles.overlap}` : styles.section}
      aria-labelledby={video.heading ? "landing-video-heading" : undefined}
      aria-label={video.heading ? undefined : video.title}
    >
      {video.heading ? (
        <Container>
          <h2 id="landing-video-heading" className={styles.heading}>
            <SwiftUpText text={video.heading} whenVisible />
          </h2>
          {video.intro ? (
            <p className={styles.intro}>
              <SwiftUpText text={video.intro} whenVisible lineDelay={0.12} delay={0.2} />
            </p>
          ) : null}
        </Container>
      ) : null}

      <div className={styles.stage}>
        <div className={styles.sticky}>
          <div className={styles.frame}>
            <video
              ref={videoRef}
              className={styles.video}
              poster={video.poster}
              muted
              loop
              playsInline
              preload="metadata"
              aria-label={video.title}
            >
              {video.sources.map((source) => (
                <source key={source.src} src={source.src} media={source.media} type="video/mp4" />
              ))}
            </video>
            <button
              type="button"
              className={styles.toggle}
              onClick={toggle}
              aria-label={paused ? video.play : video.pause}
              data-paused={paused || undefined}
            >
              <span aria-hidden="true" className={styles.icon} />
            </button>
          </div>

          {chapters.length > 0 ? (
          <FadeIn whenVisible delay={0.2} className={styles.chaptersWrap}>
            <ol ref={chaptersRef} className={styles.chapters} aria-label={video.chaptersLabel}>
              {chapters.map((chapter, i) => (
                <li key={chapter.title}>
                  <button
                    type="button"
                    className={styles.chapter}
                    aria-current={i === active ? "step" : undefined}
                    data-done={i < active || undefined}
                    onClick={() => seek(i)}
                  >
                    <span className={styles.bar} aria-hidden="true" />
                    <span className={styles.chapterTitle}>{chapter.title}</span>
                    <span className={styles.chapterText}>{chapter.text}</span>
                  </button>
                </li>
              ))}
            </ol>
          </FadeIn>
          ) : null}
        </div>
      </div>
    </section>
  );
}
