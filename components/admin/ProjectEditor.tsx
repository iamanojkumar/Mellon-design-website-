"use client";

import { useRef, useState } from "react";
import type { Project } from "@/lib/projects";
import { PROJECT_STATUSES, STATUS_LABELS } from "@/lib/project-fields";
import type { Folder } from "@/lib/folders";
import type { Industry, Service } from "@/lib/content";
import type { LocaleConfig } from "@/lib/locale";
import {
  saveProjectAction,
  deleteProjectAction,
  duplicateProjectAction,
  uploadMediaAction,
} from "@/app/admin/actions";
import { RichContentEditor } from "./RichContentEditor";
import { BlocksEditor } from "./BlocksEditor";
import type { ProjectFormState } from "./form-state";
import styles from "./ProjectEditor.module.css";

export function ProjectEditor({
  locale,
  project,
  form,
  onChange,
  folders,
  industries,
  services,
  otherLocales,
  onSaved,
  onDeleted,
  onDuplicated,
}: {
  locale: string;
  project: Project | null;
  form: ProjectFormState;
  onChange: (patch: Partial<ProjectFormState>) => void;
  folders: Folder[];
  industries: Industry[];
  services: Service[];
  otherLocales: LocaleConfig[];
  onSaved: (project: Project) => void;
  onDeleted: (id: string) => void;
  onDuplicated: (project: Project) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicateLocale, setDuplicateLocale] = useState(otherLocales[0]?.code ?? "");
  const [duplicating, setDuplicating] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [uploadingHero, setUploadingHero] = useState(false);
  const heroFileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadMediaAction(formData);
    if (!result.ok) throw new Error(result.error);
    return result.data;
  };

  const handleHeroFile = async (file: File) => {
    setUploadingHero(true);
    try {
      onChange({ heroImage: await uploadFile(file) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploadingHero(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const result = await saveProjectAction({ id: project?.id ?? null, locale, ...form });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSaved(result.data);
  };

  const handleDelete = async () => {
    if (!project) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setDeleting(true);
    const result = await deleteProjectAction(project.id, locale);
    setDeleting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onDeleted(project.id);
  };

  const handleDuplicate = async () => {
    if (!project || !duplicateLocale) return;
    setDuplicating(true);
    setDuplicateError(null);
    const result = await duplicateProjectAction(project.id, duplicateLocale);
    setDuplicating(false);
    if (!result.ok) {
      setDuplicateError(result.error);
      return;
    }
    onDuplicated(result.data);
  };

  return (
    <div className={styles.editor}>
      <div className={styles.statusBar}>
        <div className={styles.statusGroup} role="group" aria-label="Status">
          {PROJECT_STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              className={styles.statusOption}
              aria-pressed={form.status === status}
              onClick={() => onChange({ status })}
            >
              {STATUS_LABELS[status]}
            </button>
          ))}
        </div>
        <div className={styles.field}>
          <select
            className="a-input"
            value={form.folderId ?? ""}
            onChange={(event) => onChange({ folderId: event.target.value || null })}
            aria-label="Folder"
          >
            <option value="">Unfiled</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </div>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(event) => onChange({ featured: event.target.checked })}
          />
          <span>Featured</span>
        </label>
        <div className={styles.actions}>
          <button type="button" className="a-btn a-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
          {project && (
            <button
              type="button"
              className="a-btn a-btn-danger"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : confirmingDelete ? "Confirm delete" : "Delete"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="a-error" role="alert">
          {error}
        </p>
      )}

      <div className="a-row">
        <div className="a-field">
          <label htmlFor="pe-title">Title</label>
          <input
            id="pe-title"
            type="text"
            value={form.title}
            onChange={(event) => onChange({ title: event.target.value })}
          />
        </div>
        <div className="a-field">
          <label htmlFor="pe-slug">Slug</label>
          <input
            id="pe-slug"
            type="text"
            placeholder="auto from title"
            value={form.slug}
            onChange={(event) => onChange({ slug: event.target.value })}
          />
        </div>
      </div>

      <div className="a-field">
        <label htmlFor="pe-summary">Summary</label>
        <textarea
          id="pe-summary"
          rows={2}
          value={form.summary}
          onChange={(event) => onChange({ summary: event.target.value })}
        />
      </div>

      <div className="a-row">
        <div className="a-field">
          <label htmlFor="pe-category">Category (industry)</label>
          <select
            id="pe-category"
            value={form.category}
            onChange={(event) => onChange({ category: event.target.value })}
          >
            <option value="">— Select —</option>
            {industries.map((industry) => (
              <option key={industry.slug} value={industry.slug}>
                {industry.name}
              </option>
            ))}
          </select>
        </div>
        <div className="a-field">
          <label htmlFor="pe-service">Service</label>
          <select
            id="pe-service"
            value={form.service}
            onChange={(event) => onChange({ service: event.target.value })}
          >
            <option value="">— Select —</option>
            {services.map((service) => (
              <option key={service.slug} value={service.slug}>
                {service.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="a-field">
        <span className="a-label">Hero image</span>
        <div className={styles.heroRow}>
          {form.heroImage ? (
            // Doubles as the dimension probe: naturalWidth/Height on load gives
            // us intrinsic size for free, so nobody has to type it in.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className={styles.heroPreview}
              src={form.heroImage}
              alt=""
              onLoad={(event) =>
                onChange({
                  heroImageWidth: event.currentTarget.naturalWidth || null,
                  heroImageHeight: event.currentTarget.naturalHeight || null,
                })
              }
              onError={() => onChange({ heroImageWidth: null, heroImageHeight: null })}
            />
          ) : (
            <div className={styles.heroPlaceholder}>No image</div>
          )}
          <input
            className="a-input"
            type="text"
            placeholder="Paste an image URL…"
            value={form.heroImage}
            onChange={(event) => onChange({ heroImage: event.target.value })}
          />
          <button
            type="button"
            className="a-btn"
            onClick={() => heroFileInputRef.current?.click()}
            disabled={uploadingHero}
          >
            {uploadingHero ? "Uploading…" : "Upload"}
          </button>
          <input
            ref={heroFileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) handleHeroFile(file);
            }}
          />
        </div>
      </div>

      {form.heroImage && (
        <div className="a-field">
          <label htmlFor="pe-hero-alt">
            Hero alt text
            {form.heroImageWidth && form.heroImageHeight
              ? ` — ${form.heroImageWidth}×${form.heroImageHeight}px`
              : ""}
          </label>
          <input
            id="pe-hero-alt"
            type="text"
            placeholder="Describe the image for screen readers and image search"
            value={form.heroImageAlt}
            onChange={(event) => onChange({ heroImageAlt: event.target.value })}
          />
        </div>
      )}

      <div className="a-field">
        <span className="a-label">Content</span>
        <RichContentEditor
          value={form.content}
          onChange={(content) => onChange({ content })}
          onUploadFile={uploadFile}
        />
      </div>

      <div className="a-field">
        <span className="a-label">Blocks</span>
        <BlocksEditor
          blocks={form.blocks}
          onChange={(blocks) => onChange({ blocks })}
          onUploadFile={uploadFile}
        />
      </div>

      {project && otherLocales.length > 0 && (
        <div className={styles.duplicate}>
          <span className="a-label">Duplicate to another locale (translated via DeepSeek)</span>
          <div className={styles.duplicateRow}>
            <select
              className="a-input"
              value={duplicateLocale}
              onChange={(event) => setDuplicateLocale(event.target.value)}
            >
              {otherLocales.map((otherLocale) => (
                <option key={otherLocale.code} value={otherLocale.code}>
                  {otherLocale.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="a-btn"
              onClick={handleDuplicate}
              disabled={duplicating || !duplicateLocale}
            >
              {duplicating ? "Translating…" : "Duplicate & translate"}
            </button>
          </div>
          {duplicateError && (
            <p className="a-error" role="alert">
              {duplicateError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
