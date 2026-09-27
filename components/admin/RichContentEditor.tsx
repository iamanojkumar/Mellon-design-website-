"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./RichContentEditor.module.css";
import { MediaPopover } from "./MediaPopover";
import { EmbedPopover } from "./EmbedPopover";

const getExtension = (filename: string) => {
  const match = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : "";
};

const IMAGE_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  svg: "image/svg+xml",
};

const VIDEO_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  ogg: "video/ogg",
  ogv: "video/ogg",
  mov: "video/quicktime",
};

const ALLOWED_IMAGE_MIME = new Set(Object.values(IMAGE_TYPES));

/**
 * Rich HTML editor for a project's case-study body. contentEditable +
 * document.execCommand, same as most lightweight CMS editors — it produces
 * plain stored HTML, which is what lib/projects.ts persists in `content`.
 */
export function RichContentEditor({
  value,
  onChange,
  onUploadFile,
}: {
  value: string;
  onChange: (next: string) => void;
  onUploadFile: (file: File) => Promise<string>;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const [activePopover, setActivePopover] = useState<"image" | "video" | "embed" | null>(null);

  useEffect(() => {
    if (!activePopover) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        setActivePopover(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activePopover]);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.innerHTML !== value) {
      editor.innerHTML = value;
    }
  }, [value]);

  const updateValue = () => {
    if (!editorRef.current) return;
    onChange(editorRef.current.innerHTML);
  };

  const execCommand = (cmd: string, commandValue?: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(cmd, false, commandValue);
    updateValue();
  };

  const insertLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) execCommand("createLink", url);
  };

  const insertHtmlAtSelection = (html: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand("insertHTML", false, html);
    updateValue();
  };

  const insertImageSrc = (src: string) => {
    insertHtmlAtSelection(
      `<img src="${src}" alt="" loading="lazy" style="max-width:100%;border-radius:4px;margin:12px 0;display:block" />`,
    );
  };

  const insertVideoSrc = (src: string, type?: string) => {
    insertHtmlAtSelection(
      `<video controls style="max-width:100%;border-radius:4px;margin:12px 0;display:block"><source src="${src}"${
        type ? ` type="${type}"` : ""
      } />Your browser does not support the video tag.</video>`,
    );
  };

  const handleImageUpload = async (file: File) => {
    const extension = getExtension(file.name);
    if (!IMAGE_TYPES[extension]) {
      throw new Error(`Unsupported image format ".${extension || "?"}". Use one of: ${Object.keys(IMAGE_TYPES).join(", ")}.`);
    }
    const url = await onUploadFile(file);
    insertImageSrc(url);
  };

  const handleVideoUpload = async (file: File) => {
    const extension = getExtension(file.name);
    if (!VIDEO_TYPES[extension]) {
      throw new Error(`Unsupported video format ".${extension || "?"}". Use one of: ${Object.keys(VIDEO_TYPES).join(", ")}.`);
    }
    const url = await onUploadFile(file);
    insertVideoSrc(url, VIDEO_TYPES[extension]);
  };

  /** Wrapped so a public page can scope or sandbox third-party embeds in CSS. */
  const insertEmbed = (html: string) => {
    insertHtmlAtSelection(`<div class="embed">${html}</div><p><br /></p>`);
  };

  const handleImageLink = (url: string) => insertImageSrc(url);

  const handleVideoLink = (url: string) => {
    const extension = getExtension(url);
    insertVideoSrc(url, VIDEO_TYPES[extension]);
  };

  const handlePaste = async (event: React.ClipboardEvent<HTMLDivElement>) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    let imageFile: File | null = null;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          imageFile = file;
          break;
        }
      }
    }

    if (!imageFile) return;
    event.preventDefault();

    if (!ALLOWED_IMAGE_MIME.has(imageFile.type)) {
      window.alert(`Unsupported image format "${imageFile.type || "unknown"}".`);
      return;
    }

    const placeholderId = `upload-${crypto.randomUUID()}`;
    insertHtmlAtSelection(
      `<span id="${placeholderId}" contenteditable="false" style="display:inline-block;padding:4px 8px;border-radius:4px;background:var(--color-paper-tint);color:var(--color-fg-muted);font-size:13px;">Uploading image…</span>`,
    );

    try {
      const url = await onUploadFile(imageFile);
      const placeholder = document.getElementById(placeholderId);
      if (placeholder) {
        const img = document.createElement("img");
        img.src = url;
        img.alt = "";
        img.loading = "lazy";
        img.style.cssText = "max-width:100%;border-radius:4px;margin:12px 0;display:block";
        placeholder.replaceWith(img);
        updateValue();
      }
    } catch (err) {
      const placeholder = document.getElementById(placeholderId);
      if (placeholder) {
        placeholder.textContent = err instanceof Error ? err.message : "Image upload failed.";
        updateValue();
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Tab") {
      event.preventDefault();
      document.execCommand("insertHTML", false, "&nbsp;&nbsp;&nbsp;&nbsp;");
      updateValue();
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar} ref={toolbarRef}>
        <button type="button" className={styles.button} onClick={() => execCommand("formatBlock", "h2")} title="Heading 2">
          H2
        </button>
        <button type="button" className={styles.button} onClick={() => execCommand("formatBlock", "h3")} title="Heading 3">
          H3
        </button>
        <button type="button" className={styles.button} onClick={() => execCommand("formatBlock", "p")} title="Paragraph">
          ¶
        </button>
        <div className={styles.separator} />
        <button type="button" className={styles.button} onClick={() => execCommand("bold")} title="Bold">
          B
        </button>
        <button type="button" className={styles.button} onClick={() => execCommand("italic")} title="Italic">
          I
        </button>
        <button type="button" className={styles.button} onClick={() => execCommand("insertUnorderedList")} title="Bullet list">
          •
        </button>
        <button type="button" className={styles.button} onClick={() => execCommand("insertOrderedList")} title="Numbered list">
          1.
        </button>
        <div className={styles.separator} />
        <button type="button" className={styles.button} onClick={insertLink} title="Link">
          Link
        </button>
        <div className={styles.toolbarItem}>
          <button
            type="button"
            className={styles.button}
            onClick={() => setActivePopover((current) => (current === "image" ? null : "image"))}
            title="Insert image"
          >
            Image
          </button>
          {activePopover === "image" && (
            <MediaPopover
              accept="image/*"
              label="Insert image"
              onUpload={handleImageUpload}
              onLink={handleImageLink}
              onClose={() => setActivePopover(null)}
            />
          )}
        </div>
        <div className={styles.toolbarItem}>
          <button
            type="button"
            className={styles.button}
            onClick={() => setActivePopover((current) => (current === "video" ? null : "video"))}
            title="Insert video"
          >
            Video
          </button>
          {activePopover === "video" && (
            <MediaPopover
              accept="video/*"
              label="Insert video"
              onUpload={handleVideoUpload}
              onLink={handleVideoLink}
              onClose={() => setActivePopover(null)}
            />
          )}
        </div>
        <div className={styles.toolbarItem}>
          <button
            type="button"
            className={styles.button}
            onClick={() => setActivePopover((current) => (current === "embed" ? null : "embed"))}
            title="Insert embed code"
          >
            Embed
          </button>
          {activePopover === "embed" && (
            <EmbedPopover onInsert={insertEmbed} onClose={() => setActivePopover(null)} />
          )}
        </div>
        <div className={styles.separator} />
        <button type="button" className={styles.button} onClick={() => execCommand("removeFormat")} title="Clear format">
          Clear
        </button>
      </div>
      <div
        ref={editorRef}
        className={styles.editor}
        contentEditable
        onInput={updateValue}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        data-placeholder="Write the case study…"
        suppressContentEditableWarning
      />
    </div>
  );
}
