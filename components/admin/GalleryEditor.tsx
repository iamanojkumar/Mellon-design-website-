"use client";

import { useEffect, useRef, useState } from "react";
import type { GalleryImage } from "@/lib/project-gallery";
import styles from "./ProjectEditor.module.css";

/**
 * The images after the hero, for image-led projects. Upload several at once
 * (each goes through the same signed-upload + AVIF pipeline as the hero), or
 * paste a URL; reorder, remove, and give each its alt text. Sizes are read
 * from the image itself when its preview loads, like the hero's.
 */
export function GalleryEditor({
  images,
  onChange,
  onUploadFile,
}: {
  images: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
  onUploadFile: (file: File) => Promise<string>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Uploads finish one by one; each must append to the list as it is *now*,
  // not as it was when the batch started.
  const latest = useRef(images);
  useEffect(() => {
    latest.current = images;
  }, [images]);

  const commit = (next: GalleryImage[]) => {
    latest.current = next;
    onChange(next);
  };

  const update = (index: number, patch: Partial<GalleryImage>) =>
    commit(latest.current.map((image, i) => (i === index ? { ...image, ...patch } : image)));

  const move = (index: number, step: number) => {
    const next = [...latest.current];
    const target = index + step;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    commit(next);
  };

  const remove = (index: number) => commit(latest.current.filter((_, i) => i !== index));

  const uploadAll = async (files: File[]) => {
    setError(null);
    setProgress({ done: 0, total: files.length });
    const failed: string[] = [];
    for (const [i, file] of files.entries()) {
      try {
        const src = await onUploadFile(file);
        commit([...latest.current, { src, alt: "", width: null, height: null }]);
      } catch (err) {
        failed.push(`${file.name}: ${err instanceof Error ? err.message : "upload failed"}`);
      }
      setProgress({ done: i + 1, total: files.length });
    }
    setProgress(null);
    if (failed.length) setError(failed.join(" · "));
  };

  const addUrl = () => {
    const src = url.trim();
    if (!src) return;
    commit([...latest.current, { src, alt: "", width: null, height: null }]);
    setUrl("");
  };

  return (
    <div className={styles.gallery}>
      {images.length > 0 && (
        <ol className={styles.galleryList}>
          {images.map((image, index) => (
            <li key={`${image.src}-${index}`} className={styles.galleryItem}>
              {/* Also the size probe, as with the hero preview. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={styles.galleryThumb}
                src={image.src}
                alt=""
                onLoad={(event) => {
                  const { naturalWidth, naturalHeight } = event.currentTarget;
                  if (naturalWidth && (naturalWidth !== image.width || naturalHeight !== image.height)) {
                    update(index, { width: naturalWidth, height: naturalHeight });
                  }
                }}
              />
              <div className={styles.galleryFields}>
                <input
                  className="a-input"
                  type="text"
                  aria-label={`Alt text for image ${index + 2}`}
                  placeholder="Alt text — describe the image"
                  value={image.alt}
                  onChange={(event) => update(index, { alt: event.target.value })}
                />
                <span className="a-hint">
                  Image {index + 2}
                  {image.width && image.height ? ` — ${image.width}×${image.height}px` : ""}
                </span>
              </div>
              <div className={styles.galleryActions}>
                <button
                  type="button"
                  className="a-btn"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move image ${index + 2} earlier`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="a-btn"
                  onClick={() => move(index, 1)}
                  disabled={index === images.length - 1}
                  aria-label={`Move image ${index + 2} later`}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="a-btn a-btn-danger"
                  onClick={() => remove(index)}
                  aria-label={`Remove image ${index + 2}`}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className={styles.heroRow}>
        <input
          className="a-input"
          type="text"
          placeholder="Paste an image URL…"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addUrl();
            }
          }}
        />
        <button type="button" className="a-btn" onClick={addUrl} disabled={!url.trim()}>
          Add
        </button>
        <button
          type="button"
          className="a-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={progress !== null}
        >
          {progress ? `Uploading ${progress.done + 1} of ${progress.total}…` : "Upload images"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            if (files.length) uploadAll(files);
          }}
        />
      </div>

      {error && (
        <p className="a-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
