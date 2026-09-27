"use client";

import { useRef, useState } from "react";
import styles from "./MediaPopover.module.css";

export function MediaPopover({
  accept,
  label,
  onUpload,
  onLink,
  onClose,
}: {
  accept: string;
  label: string;
  onUpload: (file: File) => Promise<void>;
  onLink: (url: string) => void;
  onClose: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      await onUpload(file);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleLinkSubmit = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    onLink(trimmed);
    onClose();
  };

  return (
    <div className={styles.popover}>
      <div className={styles.header}>
        <span>{label}</span>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <button
        type="button"
        className={styles.uploadButton}
        onClick={() => fileInputRef.current?.click()}
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
        />
        <button type="button" className={styles.insertButton} onClick={handleLinkSubmit} disabled={!url.trim()}>
          Insert
        </button>
      </div>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
