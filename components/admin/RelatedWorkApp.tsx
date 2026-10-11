"use client";

import { useMemo, useState, useTransition } from "react";
import { enabledLocales } from "@/lib/locale";
import { pickRelated, projectMatchesPage, type RelatedPicks } from "@/lib/related-pick";
import {
  loadRelatedAction,
  saveRelatedAction,
  type RelatedData,
  type RelatedPage,
} from "@/app/admin/related-actions";
import { RelatedPicker, type PickerCandidate } from "./RelatedPicker";
import appStyles from "./AdminApp.module.css";
import sideStyles from "./ProjectSidebar.module.css";
import editorStyles from "./ProjectEditor.module.css";

const keyOf = (page: Pick<RelatedPage, "kind" | "slug">) => `${page.kind}:${page.slug}`;

/**
 * Pick and cut the "Related work" shown on each service and industry page.
 * Landing pages read the picks of the service they belong to.
 */
export function RelatedWorkApp({
  initialLocale,
  initialData,
  initialError,
}: {
  initialLocale: string;
  initialData: RelatedData;
  initialError: string | null;
}) {
  const [locale, setLocale] = useState(initialLocale);
  const [data, setData] = useState(initialData);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  // Unsaved edits per page, so switching pages never loses work.
  const [drafts, setDrafts] = useState<Record<string, RelatedPicks>>({});
  const [notice, setNotice] = useState<string | null>(initialError);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const savedPicks = useMemo(() => {
    const map: Record<string, RelatedPicks> = {};
    for (const override of data.overrides) {
      map[keyOf(override)] = { pinned: override.pinned, hidden: override.hidden };
    }
    return map;
  }, [data.overrides]);

  const picksFor = (key: string): RelatedPicks =>
    drafts[key] ?? savedPicks[key] ?? { pinned: [], hidden: [] };

  const candidatesFor = (page: RelatedPage): PickerCandidate[] =>
    data.projects.map((project) => {
      const auto = projectMatchesPage(project, page.kind, page.slug);
      return {
        id: project.id,
        title: project.title,
        auto,
        reason: !auto
          ? undefined
          : page.kind === "industry"
            ? "same industry"
            : project.service === page.slug
              ? "same service"
              : "also relevant",
      };
    });

  const countShown = (page: RelatedPage) =>
    pickRelated(candidatesFor(page), picksFor(keyOf(page))).length;

  const selected = data.pages.find((page) => keyOf(page) === selectedKey) ?? null;

  const switchLocale = (next: string) => {
    startTransition(async () => {
      const result = await loadRelatedAction(next);
      if (!result.ok) {
        setNotice(result.error);
        return;
      }
      setLocale(next);
      setData(result.data);
      setDrafts({});
      setSelectedKey(null);
      setNotice(null);
      setError(null);
    });
  };

  const dirty = selectedKey !== null && !!drafts[selectedKey];

  const handleSave = async () => {
    if (!selected || !selectedKey) return;
    setSaving(true);
    setError(null);
    const result = await saveRelatedAction(locale, selected.kind, selected.slug, picksFor(selectedKey));
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const savedRow = result.data;
    setData((current) => ({
      ...current,
      overrides: [
        ...current.overrides.filter((override) => keyOf(override) !== keyOf(savedRow)),
        savedRow,
      ],
    }));
    setDrafts((current) => {
      const { [selectedKey]: _removed, ...rest } = current;
      return rest;
    });
    setSaved(selectedKey);
    setTimeout(() => setSaved((current) => (current === selectedKey ? null : current)), 1500);
  };

  const discard = () => {
    if (!selectedKey) return;
    setDrafts((current) => {
      const { [selectedKey]: _removed, ...rest } = current;
      return rest;
    });
  };

  const renderGroup = (kind: RelatedPage["kind"], title: string) => (
    <div className={sideStyles.list} style={{ paddingLeft: 0 }}>
      <span className="a-label" style={{ padding: "6px 8px", display: "block" }}>
        {title}
      </span>
      {data.pages
        .filter((page) => page.kind === kind)
        .map((page) => {
          const key = keyOf(page);
          return (
            <div key={key} className={sideStyles.row}>
              <button
                type="button"
                className={`${sideStyles.item} ${key === selectedKey ? sideStyles.active : ""}`}
                onClick={() => {
                  setSelectedKey(key);
                  setError(null);
                }}
              >
                <span className={sideStyles.itemHead}>
                  <span className={sideStyles.itemTitle}>{page.name}</span>
                </span>
                <span className={sideStyles.itemMeta}>
                  <span className={sideStyles.taxonomy}>
                    {countShown(page)} shown{drafts[key] ? " · unsaved" : ""}
                  </span>
                </span>
              </button>
            </div>
          );
        })}
    </div>
  );

  return (
    <div className={appStyles.shell}>
      <header className={appStyles.topbar}>
        <span className={appStyles.brand}>Related work</span>
        <div className={appStyles.topbarControls}>
          <label className={appStyles.localeSwitcher}>
            <span>Locale</span>
            <select
              value={locale}
              onChange={(event) => switchLocale(event.target.value)}
              disabled={isPending}
            >
              {enabledLocales.map((config) => (
                <option key={config.code} value={config.code}>
                  {config.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {notice && <div className={appStyles.notice}>{notice}</div>}

      <div className={appStyles.body}>
        <aside className={sideStyles.sidebar}>
          <div className={sideStyles.head}>
            <span className="a-label">Pages — {data.pages.length}</span>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {renderGroup("service", "Services")}
            {renderGroup("industry", "Industries")}
          </div>
        </aside>

        <div className={editorStyles.editor}>
          {!selected ? (
            <p className="a-hint">
              Choose a page to control which projects appear under its &ldquo;Related work&rdquo;.
              Only published projects can appear. Projects match on their main service, their
              &ldquo;also relevant to&rdquo; services, or their industry; pins and hides here override
              that.
            </p>
          ) : (
            <>
              <div className={editorStyles.statusBar}>
                <strong>{selected.name}</strong>
                <span className="a-hint">
                  {selected.kind === "service" ? "Service page" : "Industry page"}
                </span>
                <div className={editorStyles.actions}>
                  <button type="button" className="a-btn" onClick={discard} disabled={!dirty || saving}>
                    Discard changes
                  </button>
                  <button
                    type="button"
                    className="a-btn a-btn-primary"
                    onClick={handleSave}
                    disabled={!dirty || saving}
                  >
                    {saving ? "Saving…" : saved === selectedKey ? "Saved" : "Save"}
                  </button>
                </div>
              </div>

              {error && (
                <p className="a-error" role="alert">
                  {error}
                </p>
              )}

              <RelatedPicker
                candidates={candidatesFor(selected)}
                pinned={picksFor(selectedKey!).pinned}
                hidden={picksFor(selectedKey!).hidden}
                onChange={(picks) => setDrafts((current) => ({ ...current, [selectedKey!]: picks }))}
                emptyHint="Nothing matches this page yet, so no Related work section shows. Publish a project for it, tick it under “Also relevant to”, or add one by hand below."
              />
              {selected.kind === "service" && (
                <p className="a-hint">
                  Landing pages for this service show the same list.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
