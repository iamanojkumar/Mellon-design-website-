"use client";

import { useEffect, useRef } from "react";
import { attachParallax } from "@/components/motion/ParallaxImage";
import { attachReveal } from "@/components/motion/attachReveal";

/**
 * Renders editor-authored HTML and gives the images in it the same scroll
 * parallax as the rest of the page. The markup is a raw string, so React can't
 * wrap those <img> tags itself: after mount each one is wrapped in a clipping
 * frame and joined to the shared parallax loop. React never re-touches the
 * injected HTML (the string is unchanged), and the cleanup unwraps everything,
 * so this is safe under StrictMode's double effect.
 */
export function ParallaxRichText({ html, className }: { html: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const cleanups: Array<() => void> = [];
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

      const detach = attachParallax(frame, img);
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
    }

    return () => cleanups.forEach((fn) => fn());
  }, [html]);

  return <div ref={ref} className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
