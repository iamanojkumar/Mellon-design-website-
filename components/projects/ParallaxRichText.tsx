"use client";

import { useEffect, useRef } from "react";
import { attachParallax } from "@/components/motion/ParallaxImage";
import { attachReveal } from "@/components/motion/attachReveal";

export type RichTextLabels = {
  /** Button names for the pause control on animated GIFs. */
  pauseAnimation: string;
  playAnimation: string;
  /** Accessible name for an embed whose markup carries no title. */
  embedTitle: string;
};

const isGif = (src: string) => /\.gif($|[?#])/i.test(src);

/**
 * Renders editor-authored HTML and gives the images in it the same scroll
 * parallax as the rest of the page, in the "contain" fit so screenshots are
 * never cropped. The markup is a raw string, so React can't
 * wrap those <img> tags itself: after mount each one is wrapped in a clipping
 * frame and joined to the shared parallax loop. React never re-touches the
 * injected HTML (the string is unchanged), and the cleanup unwraps everything,
 * so this is safe under StrictMode's double effect.
 *
 * Accessibility, applied to the same raw markup:
 *  - Animated GIFs get a pause/play button (WCAG 2.2.2) and start frozen for
 *    visitors who prefer reduced motion. Freezing paints the current frame on a
 *    canvas over the image; the image itself is never changed.
 *  - Iframes without a title get one, so screen readers can name the embed.
 */
export function ParallaxRichText({
  html,
  className,
  labels,
}: {
  html: string;
  className?: string;
  labels?: RichTextLabels;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const cleanups: Array<() => void> = [];

    if (labels) {
      for (const frame of Array.from(root.querySelectorAll("iframe"))) {
        if (!frame.getAttribute("title")) {
          frame.setAttribute("title", labels.embedTitle);
          cleanups.push(() => frame.removeAttribute("title"));
        }
      }
    }

    // Authored audio/video: no download button, no right-click save, no
    // picture-in-picture pop-out. Deterrents only; the files are also gated server-side.
    for (const media of Array.from(root.querySelectorAll<HTMLMediaElement>("audio, video"))) {
      media.setAttribute("controlsList", "nodownload");
      if (media instanceof HTMLVideoElement) media.disablePictureInPicture = true;
      const block = (event: Event) => event.preventDefault();
      media.addEventListener("contextmenu", block);
      cleanups.push(() => media.removeEventListener("contextmenu", block));
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    for (const img of Array.from(root.querySelectorAll("img"))) {
      const parent = img.parentElement;
      if (!parent) continue;

      const frame = document.createElement("span");
      frame.style.display = "block";
      frame.style.overflow = "hidden";
      frame.style.borderRadius = "var(--radius-sm)";
      parent.insertBefore(frame, img);
      frame.appendChild(img);
      // The saved markup can lose the editor's display:block, and an inline img
      // leaves a baseline gap inside the clipping frame.
      img.style.display = "block";
      img.style.willChange = "transform";
      img.style.transformOrigin = "center";

      const detach = attachParallax(frame, img, "contain");
      const detachReveal = attachReveal(frame, img);
      cleanups.push(() => {
        detach();
        detachReveal();
        img.style.display = "";
        img.style.willChange = "";
        img.style.transformOrigin = "";
        if (frame.parentElement) {
          frame.parentElement.insertBefore(img, frame);
          frame.remove();
        }
      });

      if (labels && isGif(img.currentSrc || img.src)) {
        cleanups.push(addGifControl(frame, img, labels, reduceMotion));
      }
    }

    return () => cleanups.forEach((fn) => fn());
  }, [html, labels]);

  return <div ref={ref} className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * Pause/play for one GIF. The "frame" overlay is a canvas holding the frame that
 * was showing when the visitor paused; hiding it lets the GIF animate again.
 * It sits in the clipping wrapper rather than over the parallaxing image, so it
 * is not carried by the parallax transform.
 */
function addGifControl(
  frame: HTMLElement,
  img: HTMLImageElement,
  labels: RichTextLabels,
  startPaused: boolean,
): () => void {
  frame.style.position = "relative";

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "none",
  });

  const button = document.createElement("button");
  button.type = "button";
  Object.assign(button.style, {
    position: "absolute",
    right: "8px",
    bottom: "8px",
    padding: "6px 10px",
    border: "0",
    borderRadius: "999px",
    background: "rgba(0,0,0,0.7)",
    color: "#fff",
    font: "inherit",
    fontSize: "13px",
    lineHeight: "1",
    cursor: "pointer",
  });

  let paused = false;
  const setPaused = (next: boolean) => {
    paused = next;
    if (paused) {
      const width = img.naturalWidth || img.clientWidth;
      const height = img.naturalHeight || img.clientHeight;
      if (width && height) {
        canvas.width = width;
        canvas.height = height;
        try {
          canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
        } catch {
          // Nothing to paint (image not decoded yet): leave it playing.
          paused = false;
        }
      } else {
        paused = false;
      }
    }
    canvas.style.display = paused ? "block" : "none";
    button.textContent = paused ? labels.playAnimation : labels.pauseAnimation;
    button.setAttribute("aria-pressed", String(paused));
  };

  button.addEventListener("click", () => setPaused(!paused));
  frame.append(canvas, button);
  setPaused(false);

  // Reduced motion: freeze as soon as there is a frame to freeze on.
  const freezeWhenReady = () => {
    if (startPaused) setPaused(true);
  };
  if (img.complete && img.naturalWidth) freezeWhenReady();
  else img.addEventListener("load", freezeWhenReady, { once: true });

  return () => {
    img.removeEventListener("load", freezeWhenReady);
    canvas.remove();
    button.remove();
    frame.style.position = "";
  };
}
