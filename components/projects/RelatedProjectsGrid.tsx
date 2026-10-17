"use client";

import { useEffect, useRef, useState } from "react";
import { FadeIn } from "@/components/motion/HeroSequence";
import { RevealGroup } from "@/components/motion/RevealGroup";
import { ProjectCard } from "@/components/blocks/ProjectCard";
import cardStyles from "@/components/blocks/ProjectCards.module.css";
import explorer from "@/components/blocks/ProjectsExplorer.module.css";

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
};

/** Cards shown at first, and added by each "Show more" — same step as the projects index. */
const STEP = 3;

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
}: {
  locale: string;
  projects: RelatedGridProject[];
  viewLink: string;
  showMoreLabel: string;
  /** "View all {count} projects": {count} is this page's total, and the button reveals them in place. */
  viewAllTemplate: string;
  expandable?: boolean;
}) {
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
    wrapRef.current?.querySelectorAll<HTMLAnchorElement>("a")[focusIndex.current]?.focus();
    focusIndex.current = null;
  }, [shown]);

  return (
    <div ref={wrapRef}>
      <RevealGroup className={cardStyles.grid}>
        {projects.slice(0, shown).map((project) => (
          <ProjectCard
            key={project.id}
            locale={locale}
            project={project}
            viewLink={viewLink}
            meta={project.meta}
          />
        ))}
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
