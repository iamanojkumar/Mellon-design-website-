/**
 * Auto-slide for the multi-image masonry tiles, run as one queue for the whole
 * page so only one tile moves at a time.
 *
 * Every tile with several images registers here. Of the tiles currently on
 * screen, the queue takes them in reading order (top to bottom, left to right
 * within a row): the first one slides to its next image, then after a pause the
 * next one does, and so on, wrapping back to the first. Scrolling brings new
 * tiles into the visible set and they join the order where they sit. A tile
 * being hovered, touched or focused is skipped, and nothing runs while the tab
 * is hidden or under prefers-reduced-motion.
 */

type Entry = {
  el: HTMLElement;
  /** Slides to the next image; resolves once the movement has finished. */
  advance: () => Promise<void>;
  visible: boolean;
  paused: boolean;
};

/** Rest between one tile finishing its slide and the next tile starting. */
const GAP_MS = 1400;
/** Delay before the first slide once a tile comes into view. */
const FIRST_MS = 700;
/** Tiles whose tops are this close count as the same row. */
const ROW_TOLERANCE = 48;

const entries = new Set<Entry>();
let observer: IntersectionObserver | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let busy = false;
let last: HTMLElement | null = null;

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function readingOrder(a: Entry, b: Entry) {
  const ra = a.el.getBoundingClientRect();
  const rb = b.el.getBoundingClientRect();
  if (Math.abs(ra.top - rb.top) > ROW_TOLERANCE) return ra.top - rb.top;
  return ra.left - rb.left;
}

function schedule(delay: number) {
  if (timer !== null || busy) return;
  timer = setTimeout(() => {
    timer = null;
    void turn();
  }, delay);
}

async function turn() {
  if (document.hidden || reducedMotion()) return schedule(GAP_MS);
  const queue = [...entries].filter((entry) => entry.visible).sort(readingOrder);
  if (queue.length === 0) {
    // Nothing on screen: stop until a tile becomes visible again.
    last = null;
    return;
  }
  const ready = queue.filter((entry) => !entry.paused);
  if (ready.length === 0) return schedule(GAP_MS);

  // The tile after the one that moved last, in the current on-screen order.
  const lastIndex = queue.findIndex((entry) => entry.el === last);
  const next =
    queue.slice(lastIndex + 1).find((entry) => !entry.paused) ?? ready[0];

  busy = true;
  try {
    await next.advance();
  } finally {
    busy = false;
  }
  last = next.el;
  schedule(GAP_MS);
}

function getObserver() {
  observer ??= new IntersectionObserver(
    (records) => {
      for (const record of records) {
        for (const entry of entries) {
          if (entry.el === record.target) entry.visible = record.intersectionRatio >= 0.6;
        }
      }
      schedule(last ? GAP_MS : FIRST_MS);
    },
    // Mostly in view, so a tile never slides while half cut off by the edge.
    { threshold: [0, 0.6] },
  );
  return observer;
}

export function registerSlideshow(el: HTMLElement, advance: () => Promise<void>) {
  const entry: Entry = { el, advance, visible: false, paused: false };
  if (typeof IntersectionObserver === "undefined" || reducedMotion()) {
    return { setPaused: () => {}, unregister: () => {} };
  }
  entries.add(entry);
  getObserver().observe(el);
  return {
    setPaused(paused: boolean) {
      entry.paused = paused;
    },
    unregister() {
      entries.delete(entry);
      observer?.unobserve(el);
      if (last === el) last = null;
      if (entries.size === 0 && timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    },
  };
}
