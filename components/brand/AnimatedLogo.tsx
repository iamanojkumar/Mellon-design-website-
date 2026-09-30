"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Image from "next/image";
import { FadeIn } from "@/components/motion/HeroSequence";
import styles from "./AnimatedLogo.module.css";

/**
 * pending: not decided yet (the animation starts from an empty frame anyway)
 * video:   transparent VP9 WebM, plays once and holds its last frame
 * webp:    the same animation as an animated WebP (loops once), for Safari/iOS,
 *          which cannot show the alpha channel in WebM
 * static:  the finished icon, for reduced motion or if playback fails
 */
type Mode = "pending" | "video" | "webp" | "static";

const ICON = "/brand/animated/mellon-icon";
/** Length of the animation (31 frames at ~30fps) plus a little margin. */
const WEBP_DURATION_MS = 1150;

function pickMode(): Mode {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "static";

  const ua = navigator.userAgent;
  // Every iOS/iPadOS browser is WebKit, so the exclusion list below is not enough there.
  const iOS =
    /iP(hone|ad|od)/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const safari = /safari/i.test(ua) && !/chrome|chromium|crios|fxios|edg|opr|android/i.test(ua);
  if (iOS || safari) return "webp";

  const canPlayWebm = document.createElement("video").canPlayType('video/webm; codecs="vp9"');
  return canPlayWebm ? "video" : "webp";
}

/**
 * Header logo: the animated icon plus the wordmark. The icon animation plays
 * once when the page first loads and its last frame (the full icon) stays until
 * the next reload; the header persists across client navigations, so it does
 * not replay. The wordmark fades in beside it.
 */
export function AnimatedLogo({
  className,
  iconSize,
  wordSize,
  playOnView = false,
  vertical = false,
}: {
  className?: string;
  /** Icon frame size in px (the drawn icon fills about 60% of its height). */
  iconSize?: number;
  /** Wordmark height in px. */
  wordSize?: number;
  /** Play whenever the logo scrolls into view (for the footer), instead of once on load. */
  playOnView?: boolean;
  /** Stack the wordmark under the icon instead of beside it. */
  vertical?: boolean;
}) {
  const [mode, setMode] = useState<Mode>("pending");
  // Counts plays: 0 = waiting for the first entry into view. Each increment restarts the animation.
  const [run, setRun] = useState(playOnView ? 0 : 1);
  const rootRef = useRef<HTMLSpanElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // playOnView: replay every time the logo scrolls back into view (at least half of it).
  useEffect(() => {
    const root = rootRef.current;
    if (!playOnView || !root) return;
    if (typeof IntersectionObserver === "undefined") {
      setRun(1);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setRun((r) => r + 1);
      },
      { threshold: 0.5 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [playOnView]);

  useEffect(() => {
    if (run === 0) return;
    const next = pickMode();
    // Have the finished icon cached, so swapping to it once the animation ends is seamless.
    if (next !== "static") new window.Image().src = `${ICON}-final.png`;
    setMode(next);
  }, [run]);

  useEffect(() => {
    if (mode !== "video") return;
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    // Autoplay can be blocked (e.g. data saver / low-power mode): show the finished icon instead.
    video.play().catch(() => setMode("static"));
  }, [mode, run]);

  return (
    <span
      ref={rootRef}
      className={[styles.root, vertical && styles.vertical, className].filter(Boolean).join(" ")}
      style={
        {
          ...(iconSize ? { "--logo-icon": `${iconSize}px` } : null),
          ...(wordSize ? { "--logo-word": `${wordSize}px` } : null),
        } as CSSProperties
      }
    >
      <span className={styles.icon} aria-hidden="true">
        {mode === "video" && (
          <video
            key={run}
            ref={videoRef}
            className={styles.media}
            src={`${ICON}.webm`}
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            tabIndex={-1}
            // Once finished, swap to the identical still image. Left as a video, browsers
            // can restart it when it scrolls out of and back into view.
            onEnded={() => setMode("static")}
            onError={() => setMode("static")}
          />
        )}
        {/* eslint-disable @next/next/no-img-element */}
        {mode === "webp" && (
          <img
            key={run}
            className={styles.media}
            src={`${ICON}.webp`}
            alt=""
            width={336}
            height={336}
            data-no-fx
            // Same idea as the video: after its one play-through, hold the still image.
            onLoad={() => window.setTimeout(() => setMode("static"), WEBP_DURATION_MS)}
          />
        )}
        {mode === "static" && (
          <img className={styles.media} src={`${ICON}-final.png`} alt="" width={336} height={336} data-no-fx />
        )}
        <noscript>
          <img className={styles.media} src={`${ICON}-final.png`} alt="" width={336} height={336} />
        </noscript>
        {/* eslint-enable @next/next/no-img-element */}
      </span>
      <FadeIn as="span" whenVisible delay={0.4}>
        <Image
          src="/brand/mellon-wordmark.svg"
          alt="Mellon"
          width={673}
          height={161}
          className={styles.wordmark}
          unoptimized
          data-no-fx
          priority
        />
      </FadeIn>
    </span>
  );
}

const LOADER = "/brand/animated/mellon-loader";

/**
 * The loading animation on repeat, for the page-transition loader. Mounts the
 * media only while `active`, so nothing is fetched or decoded when hidden.
 * WebM (with alpha) where supported; Safari/iOS get an animated WebP that
 * loops on its own; the still icon if playback fails.
 */
export function LogoIconLoop({ active, size = 96 }: { active: boolean; size?: number }) {
  const [mode, setMode] = useState<Mode>("pending");

  useEffect(() => {
    if (active) setMode(pickMode());
  }, [active]);

  if (!active) return null;

  return (
    <span className={styles.loop} style={{ "--logo-icon": `${size}px` } as CSSProperties} aria-hidden="true">
      {mode === "video" && (
        <video
          className={styles.media}
          src={`${LOADER}.webm`}
          autoPlay
          loop
          muted
          playsInline
          disablePictureInPicture
          tabIndex={-1}
          onError={() => setMode("static")}
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {mode === "webp" && <img className={styles.media} src={`${LOADER}.webp`} alt="" width={336} height={336} data-no-fx />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {mode === "static" && <img className={styles.media} src={`${ICON}-final.png`} alt="" width={336} height={336} data-no-fx />}
    </span>
  );
}
