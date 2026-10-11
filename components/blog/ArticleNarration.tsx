"use client";

import { FadeIn } from "@/components/motion/HeroSequence";
import styles from "./ArticleNarration.module.css";

/**
 * Audio version of an article. A native <audio controls> element, so keyboard
 * and screen-reader support come from the browser; the written article below it
 * is the transcript. Metadata-only preload keeps the page light. The download
 * button and right-click menu are removed, and `src` is the gated
 * /api/media/audio route rather than a storage URL (lib/protected-media.ts).
 */
export function ArticleNarration({
  src,
  title,
  note,
  rights,
}: {
  src: string;
  title: string;
  note: string;
  rights: string;
}) {
  return (
    <FadeIn whenVisible>
      <section className={styles.narration} aria-labelledby="article-audio-heading">
        <h2 id="article-audio-heading" className={styles.title}>
          {title}
        </h2>
        <audio
          className={styles.player}
          controls
          controlsList="nodownload noplaybackrate"
          preload="metadata"
          src={src}
          onContextMenu={(event) => event.preventDefault()}
        />
        <p className={styles.note}>{note}</p>
        <p className={styles.note}>{rights}</p>
      </section>
    </FadeIn>
  );
}
