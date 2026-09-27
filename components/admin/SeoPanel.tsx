"use client";

import { useEffect, useState } from "react";
import type { Project } from "@/lib/projects";
import { SCHEMA_TYPES } from "@/lib/project-fields";
import { previewJsonLdAction } from "@/app/admin/actions";
import type { ProjectFormState } from "./form-state";
import styles from "./SeoPanel.module.css";

/** Length hint against the point where Google usually truncates. */
function Counter({ value, max }: { value: string; max: number }) {
  const length = value.trim().length;
  if (!length) return null;
  return (
    <span className={styles.counter} data-over={length > max}>
      {length}/{max}
    </span>
  );
}

export function SeoPanel({
  locale,
  project,
  form,
  onChange,
}: {
  locale: string;
  project: Project | null;
  form: ProjectFormState;
  onChange: (patch: Partial<ProjectFormState>) => void;
}) {
  const [preview, setPreview] = useState("");
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Rebuilt server-side so the preview is byte-identical to what the public
  // page will emit. Debounced: this fires on every keystroke in title/summary.
  useEffect(() => {
    const timer = setTimeout(async () => {
      const result = await previewJsonLdAction(locale, form.slug || form.title, {
        title: form.title,
        summary: form.summary || null,
        heroImage: form.heroImage || null,
        heroImageAlt: form.heroImageAlt || null,
        heroImageWidth: form.heroImageWidth,
        heroImageHeight: form.heroImageHeight,
        metaTitle: form.metaTitle || null,
        metaDescription: form.metaDescription || null,
        focusKeyword: form.focusKeyword || null,
        ogTitle: form.ogTitle || null,
        ogDescription: form.ogDescription || null,
        ogImage: form.ogImage || null,
        schemaType: form.schemaType,
        blocks: form.blocks,
        createdAt: project?.createdAt ?? new Date().toISOString(),
        updatedAt: project?.updatedAt ?? new Date().toISOString(),
        publishedAt: project?.publishedAt ?? null,
      });
      if (result.ok) {
        setPreview(result.data);
        setPreviewError(null);
      } else {
        setPreviewError(result.error);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [
    locale,
    project,
    form.slug,
    form.title,
    form.summary,
    form.heroImage,
    form.heroImageAlt,
    form.heroImageWidth,
    form.heroImageHeight,
    form.metaTitle,
    form.metaDescription,
    form.focusKeyword,
    form.ogTitle,
    form.ogDescription,
    form.ogImage,
    form.schemaType,
    form.blocks,
  ]);

  const overrideInvalid = (() => {
    if (!form.jsonLdOverride.trim()) return false;
    try {
      JSON.parse(form.jsonLdOverride);
      return false;
    } catch {
      return true;
    }
  })();

  return (
    <div className={styles.panel}>
      <div className="a-field">
        <label htmlFor="seo-meta-title">
          Meta title <Counter value={form.metaTitle || form.title} max={60} />
        </label>
        <input
          id="seo-meta-title"
          type="text"
          placeholder={form.title || "falls back to the title"}
          value={form.metaTitle}
          onChange={(event) => onChange({ metaTitle: event.target.value })}
        />
      </div>

      <div className="a-field">
        <label htmlFor="seo-meta-description">
          Meta description <Counter value={form.metaDescription || form.summary} max={160} />
        </label>
        <textarea
          id="seo-meta-description"
          rows={3}
          placeholder={form.summary || "falls back to the summary"}
          value={form.metaDescription}
          onChange={(event) => onChange({ metaDescription: event.target.value })}
        />
      </div>

      <div className="a-field">
        <label htmlFor="seo-keyword">Focus keyword</label>
        <input
          id="seo-keyword"
          type="text"
          value={form.focusKeyword}
          onChange={(event) => onChange({ focusKeyword: event.target.value })}
        />
      </div>

      <label className={styles.checkbox}>
        <input
          type="checkbox"
          checked={form.noindex}
          onChange={(event) => onChange({ noindex: event.target.checked })}
        />
        <span>
          Hide from search engines
          <span className="a-hint"> — stays reachable by link, drops out of the index</span>
        </span>
      </label>

      <div className="a-field">
        <label htmlFor="seo-canonical">Canonical URL</label>
        <input
          id="seo-canonical"
          type="text"
          placeholder={`auto: /${locale}/work/${form.slug || "slug"}`}
          value={form.canonicalUrl}
          onChange={(event) => onChange({ canonicalUrl: event.target.value })}
        />
        {project && project.slug !== form.slug && (
          <span className="a-hint">
            Saving renames the URL. <code>{project.slug}</code> will keep working as a redirect.
          </span>
        )}
        {project && project.previousSlugs.length > 0 && (
          <span className="a-hint">
            Redirecting from: {project.previousSlugs.join(", ")}
          </span>
        )}
      </div>

      <div className={styles.divider}>Open Graph</div>

      <div className="a-field">
        <label htmlFor="seo-og-title">OG title</label>
        <input
          id="seo-og-title"
          type="text"
          placeholder={form.title || "falls back to the title"}
          value={form.ogTitle}
          onChange={(event) => onChange({ ogTitle: event.target.value })}
        />
      </div>

      <div className="a-field">
        <label htmlFor="seo-og-description">OG description</label>
        <textarea
          id="seo-og-description"
          rows={2}
          placeholder={form.summary || "falls back to the summary"}
          value={form.ogDescription}
          onChange={(event) => onChange({ ogDescription: event.target.value })}
        />
      </div>

      <div className="a-field">
        <label htmlFor="seo-og-image">OG image</label>
        <input
          id="seo-og-image"
          type="text"
          placeholder={form.heroImage || "falls back to the hero image"}
          value={form.ogImage}
          onChange={(event) => onChange({ ogImage: event.target.value })}
        />
      </div>

      <div className={styles.divider}>Structured data</div>

      <div className="a-field">
        <label htmlFor="seo-schema-type">Schema type</label>
        <select
          id="seo-schema-type"
          value={form.schemaType}
          onChange={(event) =>
            onChange({ schemaType: event.target.value as ProjectFormState["schemaType"] })
          }
        >
          {SCHEMA_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <span className="a-hint">
          CreativeWork suits a case study; Article/BlogPosting are what Google reads for Article
          rich results.
        </span>
      </div>

      <div className="a-field">
        <span className="a-label">
          Generated JSON-LD {form.jsonLdOverride.trim() && "(replaced by your override below)"}
        </span>
        {previewError ? (
          <p className="a-error">{previewError}</p>
        ) : (
          <pre className={styles.preview}>{preview || "…"}</pre>
        )}
      </div>

      <div className="a-field">
        <label htmlFor="seo-jsonld">Custom JSON-LD override</label>
        <textarea
          id="seo-jsonld"
          className="a-mono"
          rows={6}
          placeholder="Leave empty to use the generated graph above"
          value={form.jsonLdOverride}
          onChange={(event) => onChange({ jsonLdOverride: event.target.value })}
        />
        {overrideInvalid && <span className="a-error">Not valid JSON — saving will be blocked.</span>}
      </div>
    </div>
  );
}
