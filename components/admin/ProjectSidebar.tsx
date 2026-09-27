"use client";

import { useMemo, useState } from "react";
import type { Project } from "@/lib/projects";
import type { Folder } from "@/lib/folders";
import {
  createFolderAction,
  renameFolderAction,
  deleteFolderAction,
} from "@/app/admin/actions";
import { STATUS_LABELS } from "@/lib/project-fields";
import styles from "./ProjectSidebar.module.css";

const UNFILED = "__unfiled__";

export function ProjectSidebar({
  locale,
  projects,
  folders,
  currentId,
  onSelect,
  onNew,
  onFoldersChange,
  onError,
}: {
  locale: string;
  projects: Project[];
  folders: Folder[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onFoldersChange: (folders: Folder[]) => void;
  onError: (message: string | null) => void;
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Unfiled last: named folders are the organised part of the list.
  const groups = useMemo(() => {
    const byFolder = new Map<string, Project[]>();
    for (const project of projects) {
      const key = project.folderId ?? UNFILED;
      const list = byFolder.get(key);
      if (list) list.push(project);
      else byFolder.set(key, [project]);
    }
    return [
      ...folders.map((folder) => ({
        id: folder.id,
        name: folder.name,
        folder,
        items: byFolder.get(folder.id) ?? [],
      })),
      { id: UNFILED, name: "Unfiled", folder: null, items: byFolder.get(UNFILED) ?? [] },
    ];
  }, [projects, folders]);

  const toggle = (id: string) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const runFolderAction = async (run: () => Promise<void>) => {
    setBusy(true);
    onError(null);
    try {
      await run();
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = () =>
    runFolderAction(async () => {
      const name = newName.trim();
      if (!name) return;
      const result = await createFolderAction(locale, name);
      if (!result.ok) {
        onError(result.error);
        return;
      }
      onFoldersChange([...folders, result.data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
      setAdding(false);
    });

  const handleRename = (id: string) =>
    runFolderAction(async () => {
      const name = renameValue.trim();
      if (!name) return;
      const result = await renameFolderAction(id, locale, name);
      if (!result.ok) {
        onError(result.error);
        return;
      }
      onFoldersChange(
        folders
          .map((folder) => (folder.id === id ? result.data : folder))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      setRenamingId(null);
    });

  const handleDelete = (id: string) =>
    runFolderAction(async () => {
      const result = await deleteFolderAction(id, locale);
      if (!result.ok) {
        onError(result.error);
        return;
      }
      onFoldersChange(folders.filter((folder) => folder.id !== id));
      setConfirmDeleteId(null);
    });

  return (
    <aside className={styles.sidebar}>
      <div className={styles.head}>
        <span className="a-label">Projects — {projects.length}</span>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => setAdding((open) => !open)}
          title="New folder"
          disabled={busy}
        >
          +▤
        </button>
      </div>

      {adding && (
        <div className={styles.inlineRow}>
          <input
            className="a-input"
            autoFocus
            placeholder="Folder name"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleCreate();
              if (event.key === "Escape") setAdding(false);
            }}
          />
          <button type="button" className="a-btn" onClick={handleCreate} disabled={busy}>
            Add
          </button>
        </div>
      )}

      <div className={styles.groups}>
        {groups.map((group) => {
          const isCollapsed = collapsed.has(group.id);
          return (
            <section key={group.id} className={styles.group}>
              <div className={styles.groupHead}>
                <button
                  type="button"
                  className={styles.groupToggle}
                  onClick={() => toggle(group.id)}
                  aria-expanded={!isCollapsed}
                >
                  <span className={styles.caret}>{isCollapsed ? "▸" : "▾"}</span>
                  {renamingId === group.id ? null : (
                    <>
                      <span className={styles.groupName}>{group.name}</span>
                      <span className={styles.count}>{group.items.length}</span>
                    </>
                  )}
                </button>

                {group.folder && renamingId !== group.id && (
                  <span className={styles.groupActions}>
                    <button
                      type="button"
                      className={styles.iconButton}
                      title="Rename folder"
                      onClick={() => {
                        setRenamingId(group.id);
                        setRenameValue(group.name);
                      }}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className={styles.iconButton}
                      title="Delete folder (projects inside are kept, just unfiled)"
                      onClick={() => setConfirmDeleteId(group.id)}
                    >
                      ✕
                    </button>
                  </span>
                )}
              </div>

              {renamingId === group.id && (
                <div className={styles.inlineRow}>
                  <input
                    className="a-input"
                    autoFocus
                    value={renameValue}
                    onChange={(event) => setRenameValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") handleRename(group.id);
                      if (event.key === "Escape") setRenamingId(null);
                    }}
                  />
                  <button
                    type="button"
                    className="a-btn"
                    onClick={() => handleRename(group.id)}
                    disabled={busy}
                  >
                    Save
                  </button>
                </div>
              )}

              {confirmDeleteId === group.id && (
                <div className={styles.confirm}>
                  <span>Delete folder? Its {group.items.length} project(s) stay, unfiled.</span>
                  <div className={styles.inlineRow}>
                    <button
                      type="button"
                      className="a-btn a-btn-danger"
                      onClick={() => handleDelete(group.id)}
                      disabled={busy}
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      className="a-btn"
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {!isCollapsed &&
                (group.items.length === 0 ? (
                  <p className={styles.empty}>
                    {group.id === UNFILED && projects.length === 0
                      ? "No projects yet."
                      : "Empty"}
                  </p>
                ) : (
                  <div className={styles.list}>
                    {group.items.map((project) => (
                      <button
                        type="button"
                        key={project.id}
                        className={`${styles.item} ${project.id === currentId ? styles.active : ""}`}
                        onClick={() => onSelect(project.id)}
                      >
                        <span className={styles.itemHead}>
                          {/* Scannable publish state. aria-hidden because the
                              chip below already says it in words — the colour
                              is a second cue, never the only one. */}
                          <span
                            className={styles.dot}
                            data-status={project.status}
                            aria-hidden="true"
                          />
                          <span className={styles.itemTitle}>
                            {project.featured && (
                              <span className={styles.star} title="Featured">
                                ★
                              </span>
                            )}
                            {project.title || "Untitled"}
                          </span>
                        </span>
                        <span className={styles.itemMeta}>
                          <span className={styles.status} data-status={project.status}>
                            {STATUS_LABELS[project.status]}
                          </span>
                          <span className={styles.taxonomy}>
                            {project.category} · {project.service}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
            </section>
          );
        })}
      </div>

      <button type="button" className={`a-btn a-btn-primary ${styles.newButton}`} onClick={onNew}>
        + New project
      </button>
    </aside>
  );
}
