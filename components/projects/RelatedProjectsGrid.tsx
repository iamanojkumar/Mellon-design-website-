"use client";

import { useEffect, useRef, useState } from "react";
import { FadeIn } from "@/components/motion/HeroSequence";
import { RevealGroup } from "@/components/motion/RevealGroup";
import { ProjectCard } from "@/components/blocks/ProjectCard";
import { MASONRY_STEP } from "@/components/blocks/ProjectsExplorer";
import type { GalleryImage } from "@/lib/project-gallery";
import { MasonryCard, type MasonryLabels } from "./MasonryCard";
import cardStyles from "@/components/blocks/ProjectCards.module.css";
import explorer from "@/components/blocks/ProjectsExplorer.module.css";
import masonryStyles from "./Masonry.module.css";

export type RelatedGridProject = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  category: string;
  service: string;
  heroImage: string | null;
  heroImageAlt: string | null;
  /** The line above the title, already resolved to display names. */
  meta: string;
  /** Hero first, then the gallery — what a masonry tile shows. */
  images: GalleryImage[];
};

/** Cards shown at first, and added by each "Show more" — same steps as the projects index. */
const CARD_STEP = 3;

/**
 * The cards of a "Related work" section: three to begin with, three more per
 * "Show more", or all of them at once with "View all N projects" (N is this
 * page's matches; the button stays on the page, it does not navigate). All matches are passed in and revealed locally, so it is instant
 * and needs no request; the first three are in the server-rendered HTML.
 *
 * `expandable={false}` keeps the plain, capped list (landing pages).
 */
export function RelatedProjectsGrid({
  locale,
  projects,
  viewLink,
  showMoreLabel,
  viewAllTemplate,
  expandable = true,
  masonry = false,
  galleryLabels,
}: {
  locale: string;
  projects: RelatedGridProject[];
  viewLink: string;
  showMoreLabel: string;
  /** "View all {count} projects": {count} is this page's total, and the button reveals them in place. */
  viewAllTemplate: string;
  expandable?: boolean;
  /** Image-led service page: image + title tiles in a masonry wall. */
  masonry?: boolean;
  galleryLabels: MasonryLabels;
}) {
  const STEP = masonry ? MASONRY_STEP : CARD_STEP;
  const [visible, setVisible] = useState(STEP);
  const wrapRef = useRef<HTMLDivElement>(null);
  const shown = expandable ? Math.min(visible, projects.length) : Math.min(STEP, projects.length);

  const remaining = projects.length - shown;

  // Index of the first card a click added. Focus moves there once those cards
  // are actually in the DOM (an effect, not a timer: the number of cards a
  // click adds varies, and a timer can fire before the render lands).
  const focusIndex = useRef<number | null>(null);

  function reveal(count: number) {
    focusIndex.current = shown;
    setVisible(shown + count);
  }

  // The buttons disappear when the last cards arrive, which would drop keyboard
  // focus to the page; the first new card is the natural place to continue.
  useEffect(() => {
    if (focusIndex.current === null) return;
    // Masonry tiles hold two links (the image strip is mouse-only); the title
    // link is the focusable one.
    wrapRef.current
      ?.querySelectorAll<HTMLAnchorElement>(masonry ? "h3 a" : "a")
      [focusIndex.current]?.focus();
    focusIndex.current = null;
  }, [shown, masonry]);

  return (
    <div ref={wrapRef}>
      <RevealGroup className={masonry ? masonryStyles.wall : cardStyles.grid}>
        {projects.slice(0, shown).map((project) =>
          masonry ? (
            <MasonryCard key={project.id} locale={locale} project={project} labels={galleryLabels} />
          ) : (
            <ProjectCard
              key={project.id}
              locale={locale}
              project={project}
              viewLink={viewLink}
              meta={project.meta}
            />
          ),
        )}
      </RevealGroup>

      {expandable && remaining > 0 && (
        <FadeIn whenVisible>
          <div className={explorer.actions}>
            <button type="button" className={explorer.more} onClick={() => reveal(STEP)}>
              {showMoreLabel}
            </button>
            {/* With three or fewer left it would do exactly what "Show more" does. */}
            {remaining > STEP && (
              <button
                type="button"
                className={explorer.viewAll}
                onClick={() => reveal(remaining)}
              >
                {viewAllTemplate.replace("{count}", String(projects.length))}
              </button>
            )}
          </div>
        </FadeIn>
      )}
    </div>
  );
}
