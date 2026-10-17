"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProjectGroupingCopy } from "@/lib/blocks";
import { Cta } from "@/components/cta/Cta";
import { FadeIn } from "@/components/motion/HeroSequence";
import { RevealGroup } from "@/components/motion/RevealGroup";
import { ProjectCard } from "./ProjectCard";
import styles from "./ProjectsExplorer.module.css";
import cardStyles from "./ProjectCards.module.css";

export type ExplorerProject = {
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

export type ExplorerGroup = {
  slug: string;
  label: string;
  /** The standalone service/industry page; null when the slug has no page. */
  href: string | null;
  /** Project ids in this group, newest first. */
  ids: string[];
};

type Mode = "service" | "industry";

/** How many projects a group shows at first, and how many each "Show more" adds. */
const STEP = 3;

/**
 * Grouped case-study listing. The server decides the groups (see ProjectCards);
 * this only owns the two bits of state that need a browser: which grouping is
 * on, and how many projects each group has revealed.
 *
 * Everything is passed in once and revealed locally, so "Show more" is instant
 * and needs no request. The first three of each group are in the server-rendered
 * HTML, so the default view is indexable without running any script.
 */
export function ProjectsExplorer({
  locale,
  projects,
  groups,
  viewLink,
  copy,
}: {
  locale: string;
  projects: ExplorerProject[];
  groups: Record<Mode, ExplorerGroup[]>;
  viewLink: string;
  copy: ProjectGroupingCopy;
}) {
  const [mode, setMode] = useState<Mode>("service");
  // Keyed by mode + slug so a service and an industry that share a slug do not
  // share a counter, and so each grouping remembers where the visitor left it.
  const [shown, setShown] = useState<Record<string, number>>({});
  // Quick-select chips, remembered per grouping. Empty means "everything".
  const [selected, setSelected] = useState<Record<Mode, string[]>>({ service: [], industry: [] });

  const picked = selected[mode];
  const visibleGroups =
    picked.length === 0 ? groups[mode] : groups[mode].filter((group) => picked.includes(group.slug));
  // One chip picked: the chip already says which group this is, so the
  // heading would only repeat it. Two or more: the headings tell the groups apart.
  const hideLabels = picked.length === 1;

  function toggleChip(slug: string) {
    setSelected((prev) => ({
      ...prev,
      [mode]: prev[mode].includes(slug) ? prev[mode].filter((s) => s !== slug) : [...prev[mode], slug],
    }));
  }

  function clearChips() {
    setSelected((prev) => ({ ...prev, [mode]: [] }));
  }

  const byId = new Map(projects.map((project) => [project.id, project]));

  function showMore(key: string, total: number, current: number) {
    const next = Math.min(current + STEP, total);
    setShown((prev) => ({ ...prev, [key]: next }));
    // The button disappears once everything is shown, which would drop keyboard
    // focus to the page. Hand it to the "View all" link next to it instead.
    if (next >= total) {
      requestAnimationFrame(() => document.getElementById(`viewall-${key}`)?.focus());
    }
  }

  return (
    <div className={styles.root}>
      <FadeIn whenVisible>
        <div className={styles.toggle} role="group" aria-label={copy.toggleLabel}>
          {(["service", "industry"] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={styles.toggleButton}
              aria-pressed={mode === value}
              onClick={() => setMode(value)}
            >
              {value === "service" ? copy.byService : copy.byIndustry}
            </button>
          ))}
        </div>
      </FadeIn>

      {/* Quick select for the current grouping. Several can be on at once; none
          on means every group. Keyed by mode so the row re-enters on a switch. */}
      <div key={`chips-${mode}`} className={styles.chips} role="group" aria-label={copy.filterLabel}>
        <FadeIn as="span" whenVisible>
          <button
            type="button"
            className={styles.chip}
            aria-pressed={picked.length === 0}
            onClick={clearChips}
          >
            {copy.allLabel}
          </button>
        </FadeIn>
        {groups[mode].map((group, index) => (
          <FadeIn key={group.slug} as="span" whenVisible delay={(index + 1) * 0.04}>
            <button
              type="button"
              className={styles.chip}
              aria-pressed={picked.includes(group.slug)}
              onClick={() => toggleChip(group.slug)}
            >
              {group.label}
              <span className={styles.chipCount}>{group.ids.length}</span>
            </button>
          </FadeIn>
        ))}
      </div>

      {/* Keyed by mode so switching remounts the groups and the entrance
          animations play again for the new grouping. */}
      <div key={mode} className={styles.groups}>
        {visibleGroups.map((group) => {
          const key = `${mode}:${group.slug}`;
          const total = group.ids.length;
          const visible = Math.min(shown[key] ?? STEP, total);
          const countLabel = (total === 1 ? copy.countOne : copy.countOther).replace(
            "{count}",
            String(total),
          );
          const statusLabel = copy.status
            .replace("{shown}", String(visible))
            .replace("{total}", String(total));

          return (
            <section key={key} className={styles.group} aria-labelledby={`group-${key}`}>
              {hideLabels ? (
                // Kept for screen readers and the document outline.
                <h2 id={`group-${key}`} className={styles.srOnly}>
                  {group.label}
                </h2>
              ) : (
                <FadeIn whenVisible>
                  <header className={styles.groupHead}>
                    {/* The whole heading, count included, is one link to the
                        group's own page. The h2 keeps just the label, so the
                        section is still named "Web Design", not "Web Design 13
                        projects". A slug with no page renders as plain text. */}
                    {group.href ? (
                      <Link href={group.href} className={`${styles.headInner} ${styles.headLink}`}>
                        <h2 id={`group-${key}`} className={styles.groupLabel}>
                          {group.label}
                        </h2>
                        <span className={styles.count}>{countLabel}</span>
                      </Link>
                    ) : (
                      <div className={styles.headInner}>
                        <h2 id={`group-${key}`} className={styles.groupLabel}>
                          {group.label}
                        </h2>
                        <span className={styles.count}>{countLabel}</span>
                      </div>
                    )}
                  </header>
                </FadeIn>
              )}

              <RevealGroup className={cardStyles.grid}>
                {group.ids.slice(0, visible).map((id) => {
                  const project = byId.get(id);
                  return project ? (
                    <ProjectCard
                      key={id}
                      locale={locale}
                      project={project}
                      viewLink={viewLink}
                      meta={project.meta}
                    />
                  ) : null;
                })}
              </RevealGroup>

              <FadeIn whenVisible>
                <div className={styles.actions}>
                  {visible < total && (
                    <button
                      type="button"
                      className={styles.more}
                      onClick={() => showMore(key, total, visible)}
                    >
                      {copy.showMore}
                    </button>
                  )}
                  {group.href && (
                    <Cta
                      id={`viewall-${key}`}
                      label={copy.viewAll}
                      ariaLabel={`${copy.viewAll}: ${group.label}`}
                      href={group.href}
                      variant="secondary"
                      context="home"
                    />
                  )}
                  {/* The count beside the label already says how many there are, so
                      this is not shown; it only announces progress to screen
                      readers when "Show more" adds projects. */}
                  <span className={styles.srOnly} role="status" aria-live="polite">
                    {statusLabel}
                  </span>
                </div>
              </FadeIn>
            </section>
          );
        })}
      </div>
    </div>
  );
}
