"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./HomeBlocks.module.css";

type HeroImage = { src: string; alt: string; width: number; height: number };

const SWITCH_INTERVAL_MS = 4000;
const VISIBLE_RANKS = 3;
/** How much narrower each rank is than the front image, centered horizontally. */
const RANK_WIDTH_REDUCTION_PX = [0, 60, 120];

/**
 * Cycling hero image stack. The front image (rank 0) has no offset; the next
 * two peek out behind it, offset down the y-axis and narrower (all full
 * opacity). Every SWITCH_INTERVAL_MS the front image rotates to the back and
 * the next one advances — a slider built from CSS transitions only, no
 * animation library. Images beyond the 3 visible ranks simply wait their
 * turn in the rotation.
 */
export function HeroImageStack({ images }: { images: HeroImage[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const stacked = images.length > 1;

  useEffect(() => {
    if (images.length < 2) return;
    const id = setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length);
    }, SWITCH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [images.length]);

  return (
    <div
      className={
        stacked
          ? `${styles.heroImageWrap} ${styles.heroImageWrapStacked}`
          : styles.heroImageWrap
      }
    >
      {images.map((image, index) => {
        const rank = (index - activeIndex + images.length) % images.length;
        const visible = rank < VISIBLE_RANKS;
        return (
          <div
            key={index}
            className={styles.heroStackImage}
            aria-hidden={rank === 0 ? undefined : true}
            // CursorFx/ImageLiquify redraw every on-screen <img> by DOM order, not paint
            // order, so overlapping stack images can distort/paint over the front one.
            // Only the front (rank 0) image should ever be affected by those effects.
            data-no-fx={rank === 0 ? undefined : true}
            style={{
              opacity: visible ? 1 : 0,
              width: `calc(100% - ${RANK_WIDTH_REDUCTION_PX[Math.min(rank, VISIBLE_RANKS - 1)]}px)`,
              transform: `translate(-50%, calc(var(--hero-stack-offset, 0px) * ${visible ? rank : VISIBLE_RANKS}))`,
              zIndex: images.length - rank,
              pointerEvents: rank === 0 ? "auto" : "none",
            }}
          >
            <div className={styles.heroStackImageClip}>
              <Image
                src={image.src}
                alt={rank === 0 ? image.alt : ""}
                fill
                priority={index === 0}
                sizes="100vw"
                className={styles.heroImage}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
