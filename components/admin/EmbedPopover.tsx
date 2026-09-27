"use client";

import { useState } from "react";
import styles from "./EmbedPopover.module.css";

/**
 * Raw embed code (YouTube/Figma/CodePen iframes, widget scripts). Unlike
 * MediaPopover there is no upload or URL mode — the embed *is* the markup.
 */
export function EmbedPopover({
  onInsert,
  onClose,
}: {
  onInsert: (html: string) => void;
  onClose: () => void;
}) {
  const [code, setCode] = useState("");

  const insert = () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    onInsert(trimmed);
    onClose();
  };

  return (
    <div className={styles.popover}>
      <div className={styles.header}>
        <span>Insert embed</span>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <textarea
        className={styles.code}
        autoFocus
        rows={5}
        placeholder="<iframe src='https://www.youtube.com/embed/…' …></iframe>"
        value={code}
        onChange={(event) => setCode(event.target.value)}
      />
      <button type="button" className={styles.insert} onClick={insert} disabled={!code.trim()}>
        Insert
      </button>
    </div>
  );
}
