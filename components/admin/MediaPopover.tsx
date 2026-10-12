"use client";

import { useRef, useState } from "react";
import styles from "./MediaPopover.module.css";

/** What the author says about the file, so the inserted markup is accessible. */
export type MediaMeta = {
  /** Image: alt text. Video/audio: the accessible name. */
  description: string;
  /** Image only: true when the picture adds nothing a reader would miss. */
  decorative: boolean;
  /** Video only: URL of a WebVTT captions file, or "". */
  captionsUrl: string;
  /** Visible caption shown under the media (a <figcaption>), or "". */
  caption: string;
};

export type MediaKind = "image" | "video" | "audio";

const COPY: Record<MediaKind, { label: string; hint: string }> = {
  image: {
    label: "Describe the image (alt text)",
    hint: "What a screen reader says in place of the picture. Describe what matters, not “image of”.",
  },
  video: {
    label: "Title of the video",
    hint: "Read out by screen readers before the player.",
  },
  audio: {
    label: "Title of the audio",
    hint: "Read out by screen readers before the player.",
  },
};

export function MediaPopover({
  kind,
  accept,
  label,
  initial,
  onUpload,
  onLink,
  onSave,
  onUploadCaption,
  onClose,
}: {
  kind: MediaKind;
  accept?: string;
  label: string;
  /** Prefills the fields when editing media already in the text. */
  initial?: Partial<MediaMeta>;
  onUpload?: (file: File, meta: MediaMeta) => Promise<void>;
  onLink?: (url: string, meta: MediaMeta) => void;
  /** Edit mode: no upload or link, just a Save for the fields. */
  onSave?: (meta: MediaMeta) => void;
  /** Video only: stores a .vtt file and returns its public URL. */
  onUploadCaption?: (file: File) => Promise<string>;
  onClose: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const captionInputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [decorative, setDecorative] = useState(initial?.decorative ?? false);
  const [captionsUrl, setCaptionsUrl] = useState(initial?.captionsUrl ?? "");
  const [caption, setCaption] = useState(initial?.caption ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadingCaption, setUploadingCaption] = useState(false);
  const [error, setError] = useState("");

  const meta = (): MediaMeta => ({
    description: decorative ? "" : description.trim(),
    decorative,
    captionsUrl: captionsUrl.trim(),
    caption: caption.trim(),
  });

  // An image must either say what it shows or be marked decorative; the other
  // kinds fall back to a generic name, so a title is encouraged, not required.
  const missingDescription = kind === "image" && !decorative && !description.trim();
  const guard = () => {
    if (missingDescription) {
      setError("Describe the image, or tick “Decorative” if it adds nothing to the text.");
      return false;
    }
    setError("");
    return true;
  };

  const handleFile = async (file: File) => {
    if (!onUpload || !guard()) return;
    setUploading(true);
    try {
      await onUpload(file, meta());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleLinkSubmit = () => {
    const trimmed = url.trim();
    if (!onLink || !trimmed || !guard()) return;
    onLink(trimmed, meta());
    onClose();
  };

  const handleSave = () => {
    if (!onSave || !guard()) return;
    onSave(meta());
    onClose();
  };

  const handleCaptionFile = async (file: File) => {
    if (!onUploadCaption) return;
    setUploadingCaption(true);
    setError("");
    try {
      setCaptionsUrl(await onUploadCaption(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploadingCaption(false);
    }
  };

  const id = (name: string) => `media-${name}-${kind}${onSave ? "-edit" : ""}`;

  return (
    <div className={styles.popover}>
      <div className={styles.header}>
        <span>{label}</span>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <label className={styles.fieldLabel} htmlFor={id("desc")}>
        {COPY[kind].label}
      </label>
      <input
        id={id("desc")}
        type="text"
        className={styles.linkInput}
        value={description}
        onChange={(event) => {
          setDescription(event.target.value);
          if (error) setError("");
        }}
        disabled={decorative}
        aria-describedby={id("desc-hint")}
      />
      <p id={id("desc-hint")} className={styles.hint}>
        {COPY[kind].hint}
      </p>
      {kind === "image" && (
        <label className={styles.checkRow}>
          <input
            type="checkbox"
            checked={decorative}
            onChange={(event) => {
              setDecorative(event.target.checked);
              if (error) setError("");
            }}
          />
          <span>Decorative — screen readers skip it</span>
        </label>
      )}

      <label className={styles.fieldLabel} htmlFor={id("caption")}>
        Caption, optional
      </label>
      <input
        id={id("caption")}
        type="text"
        className={styles.linkInput}
        value={caption}
        onChange={(event) => setCaption(event.target.value)}
        aria-describedby={id("caption-hint")}
      />
      <p id={id("caption-hint")} className={styles.hint}>
        Shown under the {kind} for every reader.
      </p>

      {kind === "video" && onUploadCaption && (
        <>
          <span className={styles.fieldLabel}>Subtitles (.vtt), optional</span>
          <div className={styles.linkRow}>
            <input
              type="text"
              className={styles.linkInput}
              placeholder="Upload a .vtt file or paste its URL"
              value={captionsUrl}
              onChange={(event) => setCaptionsUrl(event.target.value)}
              aria-label="Subtitles file URL"
            />
            <button
              type="button"
              className={styles.insertButton}
              onClick={() => captionInputRef.current?.click()}
              disabled={uploadingCaption}
            >
              {uploadingCaption ? "…" : "Upload"}
            </button>
            <input
              ref={captionInputRef}
              type="file"
              accept=".vtt,text/vtt"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) handleCaptionFile(file);
              }}
            />
          </div>
          <p className={styles.hint}>
            Lets deaf and hard-of-hearing visitors follow the video. A video with no speech or
            meaningful sound can skip this.
          </p>
        </>
      )}

      {onSave ? (
        <button type="button" className={styles.uploadButton} onClick={handleSave}>
          Save
        </button>
      ) : (
        <>
          <button
            type="button"
            className={styles.uploadButton}
            // Check the alt text first, so the author isn't sent to pick a file
            // only to have it rejected afterwards.
            onClick={() => guard() && fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Uploading…" : "Upload from device"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) handleFile(file);
            }}
          />
          <div className={styles.divider}>or paste a link</div>
          <div className={styles.linkRow}>
            <input
              type="text"
              className={styles.linkInput}
              placeholder="https://…"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && handleLinkSubmit()}
              aria-label="Media URL"
            />
            <button type="button" className={styles.insertButton} onClick={handleLinkSubmit} disabled={!url.trim()}>
              Insert
            </button>
          </div>
        </>
      )}
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
