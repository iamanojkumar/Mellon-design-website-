"use client";

import { useMemo } from "react";
import { orderRelated, RELATED_LIMIT } from "@/lib/related-pick";
import styles from "./RelatedPicker.module.css";

export type PickerCandidate = {
  id: string;
  title: string;
  /** Qualifies on its own (same service/industry/category). */
  auto: boolean;
  /** Short note shown next to an automatic match, e.g. "same service". */
  reason?: string;
};

/**
 * Pick-and-cut control shared by the "Related work" screen and the blog editor.
 *
 * The list it shows is exactly what the site will render: pinned items first (in
 * the order set here), then automatic matches that have not been hidden, with
 * everything past the limit marked as not shown. Removing an automatic match
 * hides it rather than deleting anything; removing a pin just unpins it.
 */
export function RelatedPicker({
  candidates,
  pinned,
  hidden,
  onChange,
  limit = RELATED_LIMIT,
  emptyHint,
}: {
  candidates: PickerCandidate[];
  pinned: string[];
  hidden: string[];
  onChange: (picks: { pinned: string[]; hidden: string[] }) => void;
  limit?: number;
  emptyHint: string;
}) {
  const ordered = useMemo(
    () => orderRelated(candidates, { pinned, hidden }),
    [candidates, pinned, hidden],
  );
  const pinnedSet = useMemo(() => new Set(pinned), [pinned]);
  const hiddenItems = useMemo(
    () => candidates.filter((candidate) => hidden.includes(candidate.id) && !pinnedSet.has(candidate.id)),
    [candidates, hidden, pinnedSet],
  );
  // Anything not already in the list can be added by hand, including hidden matches.
  const addable = candidates.filter(
    (candidate) => !ordered.some((item) => item.id === candidate.id),
  );

  const present = (id: string) => candidates.some((candidate) => candidate.id === id);
  // Pins whose item is gone stay stored but never render; moves act on live ones only.
  const livePinned = pinned.filter(present);

  const pin = (id: string) =>
    onChange({
      pinned: [...pinned.filter((p) => p !== id), id],
      hidden: hidden.filter((h) => h !== id),
    });
  const unpin = (id: string) => onChange({ pinned: pinned.filter((p) => p !== id), hidden });
  const hide = (id: string) =>
    onChange({ pinned: pinned.filter((p) => p !== id), hidden: [...hidden.filter((h) => h !== id), id] });
  const restore = (id: string) => onChange({ pinned, hidden: hidden.filter((h) => h !== id) });
  const move = (id: string, direction: -1 | 1) => {
    const index = livePinned.indexOf(id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= livePinned.length) return;
    const next = [...livePinned];
    [next[index], next[target]] = [next[target], next[index]];
    // Keep stored-but-gone pins at the end so they survive a reorder.
    onChange({ pinned: [...next, ...pinned.filter((p) => !present(p))], hidden });
  };

  return (
    <div className={styles.picker}>
      {ordered.length === 0 ? (
        <p className="a-hint">{emptyHint}</p>
      ) : (
        <ol className={styles.list}>
          {ordered.map((item, index) => {
            const isPinned = pinnedSet.has(item.id);
            const pinIndex = livePinned.indexOf(item.id);
            const shown = index < limit;
            return (
              <li key={item.id} className={styles.row} data-dim={shown ? undefined : ""}>
                <span className={styles.rank}>{shown ? index + 1 : "—"}</span>
                <span className={styles.title}>
                  {item.title || "Untitled"}
                  <span className={styles.tag} data-kind={isPinned ? "pinned" : "auto"}>
                    {isPinned ? "Picked" : item.reason ?? "Automatic"}
                  </span>
                  {!shown && <span className={styles.tag}>Not shown — over the limit of {limit}</span>}
                </span>
                <span className={styles.controls}>
                  {isPinned && (
                    <>
                      <button
                        type="button"
                        className="a-btn"
                        onClick={() => move(item.id, -1)}
                        disabled={pinIndex === 0}
                        aria-label={`Move ${item.title} up`}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="a-btn"
                        onClick={() => move(item.id, 1)}
                        disabled={pinIndex === livePinned.length - 1}
                        aria-label={`Move ${item.title} down`}
                      >
                        ↓
                      </button>
                    </>
                  )}
                  {!isPinned && (
                    <button type="button" className="a-btn" onClick={() => pin(item.id)}>
                      Pin
                    </button>
                  )}
                  <button
                    type="button"
                    className="a-btn"
                    onClick={() => (isPinned ? unpin(item.id) : hide(item.id))}
                  >
                    {isPinned ? "Unpin" : "Hide"}
                  </button>
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {addable.length > 0 && (
        <div className={styles.add}>
          <select
            className="a-input"
            value=""
            onChange={(event) => event.target.value && pin(event.target.value)}
            aria-label="Add to this list"
          >
            <option value="">+ Add one by hand…</option>
            {addable.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.title || "Untitled"}
                {hidden.includes(candidate.id) ? " (hidden)" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {hiddenItems.length > 0 && (
        <div className={styles.hidden}>
          <span className="a-label">Hidden from this list</span>
          <ul className={styles.list}>
            {hiddenItems.map((item) => (
              <li key={item.id} className={styles.row}>
                <span className={styles.title}>{item.title || "Untitled"}</span>
                <span className={styles.controls}>
                  <button type="button" className="a-btn" onClick={() => restore(item.id)}>
                    Restore
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
