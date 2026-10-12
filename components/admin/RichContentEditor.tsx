"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "./RichContentEditor.module.css";
import { MediaPopover, type MediaKind, type MediaMeta } from "./MediaPopover";
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

const AUDIO_TYPES = new Set(["mp3", "m4a", "aac", "wav", "oga", "weba"]);

const ALLOWED_IMAGE_MIME = new Set(Object.values(IMAGE_TYPES));

/** Blocks the author can select, edit and delete as one unit. */
const MEDIA_BLOCK = "figure, .embed";
const MEDIA_ELEMENT = "img, video, audio";

const MEDIA_STYLE: Record<MediaKind, string> = {
  image: "max-width:100%;border-radius:4px;display:block",
  video: "max-width:100%;border-radius:4px;display:block",
  audio: "width:100%;display:block",
};

const FIGURE_STYLE = "margin:12px 0";

/**
 * Media goes in a <figure> so it can carry a visible <figcaption>. Built with
 * DOM APIs rather than strings, so captions and alt text need no escaping.
 */
function buildFigure(
  kind: MediaKind,
  src: string,
  meta: MediaMeta,
  options: { type?: string; language: string },
): HTMLElement {
  const figure = document.createElement("figure");
  figure.style.cssText = FIGURE_STYLE;

  let media: HTMLElement;
  if (kind === "image") {
    const img = document.createElement("img");
    img.src = src;
    img.loading = "lazy";
    media = img;
  } else {
    const player = document.createElement(kind);
    player.controls = true;
    player.preload = "metadata";
    if (kind === "video") {
      player.setAttribute("playsinline", "");
      const source = document.createElement("source");
      source.src = src;
      if (options.type) source.type = options.type;
      player.appendChild(source);
    } else {
      player.src = src;
    }
    media = player;
  }
  media.style.cssText = MEDIA_STYLE[kind];
  figure.appendChild(media);
  applyMeta(figure, media, kind, meta, options.language);
  return figure;
}

/** Writes alt/title, subtitles and the visible caption onto existing markup. */
function applyMeta(
  block: HTMLElement,
  media: HTMLElement,
  kind: MediaKind,
  meta: MediaMeta,
  language: string,
): HTMLElement {
  if (kind === "image") {
    // alt="" marks a decorative image; role="presentation" tells the editor's
    // missing-description check that it was a deliberate choice.
    media.setAttribute("alt", meta.description);
    if (meta.decorative) media.setAttribute("role", "presentation");
    else media.removeAttribute("role");
  } else if (meta.description) {
    media.setAttribute("aria-label", meta.description);
  } else {
    media.removeAttribute("aria-label");
  }

  if (kind === "video") {
    media.querySelectorAll("track").forEach((track) => track.remove());
    if (meta.captionsUrl) {
      const track = document.createElement("track");
      track.kind = "captions";
      track.src = meta.captionsUrl;
      track.srclang = language;
      track.label = language;
      track.default = true;
      media.appendChild(track);
    }
  }

  // Media inserted before captions existed has no <figure>; wrap it when a
  // caption is added, so the caption stays attached to it.
  let figure = block;
  if (block.tagName !== "FIGURE" && meta.caption) {
    figure = document.createElement("figure");
    figure.style.cssText = FIGURE_STYLE;
    block.replaceWith(figure);
    figure.appendChild(block);
  }
  if (figure.tagName === "FIGURE") {
    let caption = figure.querySelector("figcaption");
    if (meta.caption) {
      if (!caption) {
        caption = document.createElement("figcaption");
        figure.appendChild(caption);
      }
      caption.textContent = meta.caption;
    } else {
      caption?.remove();
    }
  }
  return figure;
}

function kindOf(media: Element): MediaKind {
  return media.tagName === "IMG" ? "image" : media.tagName === "VIDEO" ? "video" : "audio";
}

function readMeta(block: HTMLElement, media: HTMLElement): MediaMeta {
  const kind = kindOf(media);
  return {
    description: (kind === "image" ? media.getAttribute("alt") : media.getAttribute("aria-label")) ?? "",
    decorative: kind === "image" && media.getAttribute("role") === "presentation",
    captionsUrl: media.querySelector("track")?.getAttribute("src") ?? "",
    caption: block.querySelector("figcaption")?.textContent ?? "",
  };
}

/** The stored HTML: editor-only attributes stripped. */
function serialize(editor: HTMLElement): string {
  const clone = editor.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("[contenteditable]").forEach((el) => el.removeAttribute("contenteditable"));
  clone.querySelectorAll("[data-selected]").forEach((el) => el.removeAttribute("data-selected"));
  return clone.innerHTML;
}

/**
 * Figures and embeds are locked as single units, so the caret steps over them
 * and Backspace removes the whole block instead of half a <figure>.
 */
function lockMediaBlocks(editor: HTMLElement) {
  editor.querySelectorAll<HTMLElement>(MEDIA_BLOCK).forEach((el) => {
    el.contentEditable = "false";
  });
}

/**
 * Rich HTML editor for a project's case-study body. contentEditable +
 * document.execCommand, same as most lightweight CMS editors — it produces
 * plain stored HTML, which is what lib/projects.ts persists in `content`.
 */
export function RichContentEditor({
  value,
  onChange,
  onUploadFile,
  language = "en",
}: {
  value: string;
  onChange: (next: string) => void;
  onUploadFile: (file: File) => Promise<string>;
  /** BCP 47 language of the article, written on caption tracks. */
  language?: string;
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const mediaBarRef = useRef<HTMLDivElement | null>(null);
  /** Where the caret was before a toolbar popover took focus. */
  const savedRangeRef = useRef<Range | null>(null);
  const [activePopover, setActivePopover] = useState<"image" | "video" | "audio" | "embed" | null>(null);
  const [selected, setSelected] = useState<HTMLElement | null>(null);
  const [barPosition, setBarPosition] = useState<{ top: number; left: number } | null>(null);
  const [editing, setEditing] = useState(false);

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
    if (editor && serialize(editor) !== value) {
      editor.innerHTML = value;
      lockMediaBlocks(editor);
      setSelected(null);
    }
  }, [value]);

  // Remember the caret while it is in the editor; clicking a toolbar button
  // or typing in a popover moves the selection away before the insert runs.
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      if (editorRef.current?.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  const updateValue = useCallback(() => {
    if (!editorRef.current) return;
    onChange(serialize(editorRef.current));
  }, [onChange]);

  // --- Selected media block -------------------------------------------------

  const selectBlock = useCallback((block: HTMLElement | null) => {
    setSelected((current) => {
      if (current && current !== block) current.removeAttribute("data-selected");
      if (block) block.setAttribute("data-selected", "");
      return block;
    });
    setEditing(false);
  }, []);

  const positionBar = useCallback(() => {
    const wrapper = wrapperRef.current;
    if (!selected || !wrapper || !wrapper.contains(selected)) {
      setBarPosition(null);
      return;
    }
    const box = selected.getBoundingClientRect();
    const frame = wrapper.getBoundingClientRect();
    setBarPosition({ top: box.top - frame.top + 8, left: box.left - frame.left + 8 });
  }, [selected]);

  useLayoutEffect(() => {
    positionBar();
    if (!selected) return;
    window.addEventListener("resize", positionBar);
    // Images load after insert and push the block's size around.
    selected.addEventListener("load", positionBar, true);
    return () => {
      window.removeEventListener("resize", positionBar);
      selected.removeEventListener("load", positionBar, true);
    };
  }, [selected, positionBar, value]);

  useEffect(() => {
    if (!selected) return;
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (selected.contains(target) || mediaBarRef.current?.contains(target)) return;
      selectBlock(null);
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [selected, selectBlock]);

  const handleEditorClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const editor = editorRef.current;
    const target = event.target as HTMLElement;
    if (!editor) return;
    const block =
      target.closest<HTMLElement>(MEDIA_BLOCK) ?? target.closest<HTMLElement>(MEDIA_ELEMENT);
    selectBlock(block && editor.contains(block) && block !== editor ? block : null);
  };

  const selectedMedia = selected
    ? selected.matches(MEDIA_ELEMENT)
      ? selected
      : selected.querySelector<HTMLElement>(MEDIA_ELEMENT)
    : null;
  // An embed may itself contain a <video>; its markup is the author's, so it
  // only gets delete and move, not the details form.
  const selectedIsEmbed = !!selected?.matches(".embed");

  const deleteSelected = () => {
    if (!selected) return;
    const emptyAfter =
      selected.nextElementSibling?.tagName === "P" && !selected.nextElementSibling.textContent?.trim()
        ? selected.nextElementSibling
        : null;
    selected.remove();
    // Drop the blank paragraph that was inserted to type after the media,
    // unless it is all that is left.
    if (emptyAfter && editorRef.current && editorRef.current.childElementCount > 1) emptyAfter.remove();
    selectBlock(null);
    updateValue();
  };

  const moveSelected = (direction: -1 | 1) => {
    if (!selected) return;
    const sibling = direction < 0 ? selected.previousElementSibling : selected.nextElementSibling;
    if (!sibling) return;
    if (direction < 0) sibling.before(selected);
    else sibling.after(selected);
    updateValue();
    positionBar();
    selected.scrollIntoView({ block: "nearest" });
  };

  const saveSelectedMeta = (meta: MediaMeta) => {
    if (!selected || !selectedMedia) return;
    const block = applyMeta(selected, selectedMedia, kindOf(selectedMedia), meta, language);
    if (block !== selected) {
      block.contentEditable = "false";
      selected.removeAttribute("data-selected");
      selectBlock(block);
    }
    updateValue();
  };

  // --- Inserting ------------------------------------------------------------

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

  /**
   * Puts a block where the caret was, after the paragraph it sat in (a figure
   * can't live inside a <p>), and leaves an empty paragraph after it to keep
   * typing in. With no caret in the editor, the block goes at the end.
   */
  const insertBlock = (block: HTMLElement) => {
    const editor = editorRef.current;
    if (!editor) return;

    const range = savedRangeRef.current;
    let anchor: Node | null = range && editor.contains(range.startContainer) ? range.startContainer : null;
    while (anchor && anchor.parentNode !== editor) anchor = anchor.parentNode;

    const isEmptyParagraph =
      anchor instanceof HTMLElement && anchor.tagName === "P" && !anchor.textContent?.trim() && !anchor.querySelector(MEDIA_ELEMENT);
    if (anchor && isEmptyParagraph) {
      (anchor as HTMLElement).replaceWith(block);
    } else if (anchor) {
      anchor.parentNode!.insertBefore(block, anchor.nextSibling);
    } else {
      editor.appendChild(block);
    }

    let after = block.nextElementSibling;
    if (!(after instanceof HTMLElement && after.tagName === "P")) {
      const paragraph = document.createElement("p");
      paragraph.appendChild(document.createElement("br"));
      block.after(paragraph);
      after = paragraph;
    }

    block.contentEditable = "false";
    editor.focus();
    const caret = document.createRange();
    caret.setStart(after, 0);
    caret.collapse(true);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(caret);
    updateValue();
  };

  const insertMedia = (kind: MediaKind, src: string, meta: MediaMeta, type?: string) => {
    insertBlock(buildFigure(kind, src, meta, { type, language }));
  };

  const handleImageUpload = async (file: File, meta: MediaMeta) => {
    const extension = getExtension(file.name);
    if (!IMAGE_TYPES[extension]) {
      throw new Error(`Unsupported image format ".${extension || "?"}". Use one of: ${Object.keys(IMAGE_TYPES).join(", ")}.`);
    }
    insertMedia("image", await onUploadFile(file), meta);
  };

  const handleVideoUpload = async (file: File, meta: MediaMeta) => {
    const extension = getExtension(file.name);
    if (!VIDEO_TYPES[extension]) {
      throw new Error(`Unsupported video format ".${extension || "?"}". Use one of: ${Object.keys(VIDEO_TYPES).join(", ")}.`);
    }
    insertMedia("video", await onUploadFile(file), meta, VIDEO_TYPES[extension]);
  };

  const handleAudioUpload = async (file: File, meta: MediaMeta) => {
    const extension = getExtension(file.name);
    if (!AUDIO_TYPES.has(extension)) {
      throw new Error(`Unsupported audio format ".${extension || "?"}". Use one of: ${[...AUDIO_TYPES].join(", ")}.`);
    }
    insertMedia("audio", await onUploadFile(file), meta);
  };

  const uploadCaption = async (file: File) => {
    if (getExtension(file.name) !== "vtt") {
      throw new Error("Captions must be a WebVTT (.vtt) file.");
    }
    return onUploadFile(file);
  };

  /** Wrapped so a public page can scope or sandbox third-party embeds in CSS. */
  const insertEmbed = (html: string) => {
    const wrapper = document.createElement("div");
    wrapper.className = "embed";
    wrapper.innerHTML = html;
    insertBlock(wrapper);
  };

  const handleImageLink = (url: string, meta: MediaMeta) => insertMedia("image", url, meta);

  const handleVideoLink = (url: string, meta: MediaMeta) => {
    const extension = getExtension(url.split(/[?#]/)[0]);
    insertMedia("video", url, meta, VIDEO_TYPES[extension]);
  };

  const handleAudioLink = (url: string, meta: MediaMeta) => insertMedia("audio", url, meta);

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

    const placeholder = document.createElement("p");
    placeholder.className = styles.uploading;
    placeholder.textContent = "Uploading image…";
    insertBlock(placeholder);

    try {
      const url = await onUploadFile(imageFile);
      // No description yet: the missing-alt hint flags it until the author
      // clicks the image and adds one.
      const figure = buildFigure("image", url, { description: "", decorative: false, captionsUrl: "", caption: "" }, { language });
      figure.contentEditable = "false";
      if (placeholder.isConnected) placeholder.replaceWith(figure);
      updateValue();
    } catch (err) {
      placeholder.textContent = err instanceof Error ? err.message : "Image upload failed.";
      updateValue();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (selected && (event.key === "Backspace" || event.key === "Delete")) {
      event.preventDefault();
      deleteSelected();
      return;
    }
    if (selected && event.key === "Escape") {
      selectBlock(null);
      return;
    }
    if (event.key === "Tab") {
      event.preventDefault();
      document.execCommand("insertHTML", false, "&nbsp;&nbsp;&nbsp;&nbsp;");
      updateValue();
    }
  };

  const togglePopover = (name: "image" | "video" | "audio" | "embed") =>
    setActivePopover((current) => (current === name ? null : name));

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
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
          <button type="button" className={styles.button} onClick={() => togglePopover("image")} title="Insert image">
            Image
          </button>
          {activePopover === "image" && (
            <MediaPopover
              kind="image"
              accept="image/*"
              label="Insert image or GIF"
              onUpload={handleImageUpload}
              onLink={handleImageLink}
              onClose={() => setActivePopover(null)}
            />
          )}
        </div>
        <div className={styles.toolbarItem}>
          <button type="button" className={styles.button} onClick={() => togglePopover("video")} title="Insert video">
            Video
          </button>
          {activePopover === "video" && (
            <MediaPopover
              kind="video"
              accept="video/*"
              label="Insert video"
              onUpload={handleVideoUpload}
              onLink={handleVideoLink}
              onUploadCaption={uploadCaption}
              onClose={() => setActivePopover(null)}
            />
          )}
        </div>
        <div className={styles.toolbarItem}>
          <button type="button" className={styles.button} onClick={() => togglePopover("audio")} title="Insert audio">
            Audio
          </button>
          {activePopover === "audio" && (
            <MediaPopover
              kind="audio"
              accept="audio/*"
              label="Insert audio"
              onUpload={handleAudioUpload}
              onLink={handleAudioLink}
              onClose={() => setActivePopover(null)}
            />
          )}
        </div>
        <div className={styles.toolbarItem}>
          <button type="button" className={styles.button} onClick={() => togglePopover("embed")} title="Insert embed code">
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
        onClick={handleEditorClick}
        data-placeholder="Write the case study…"
        suppressContentEditableWarning
      />
      {selected && barPosition && (
        <div
          ref={mediaBarRef}
          className={styles.mediaBar}
          style={{ top: barPosition.top, left: barPosition.left }}
          role="toolbar"
          aria-label="Selected media"
        >
          {selectedMedia && !selectedIsEmbed && (
            <button type="button" className={styles.mediaButton} onClick={() => setEditing((open) => !open)}>
              {kindOf(selectedMedia) === "image" ? "Alt text & caption" : "Title & caption"}
            </button>
          )}
          {selected.parentElement === editorRef.current && (
            <>
              <button type="button" className={styles.mediaButton} onClick={() => moveSelected(-1)} title="Move up" aria-label="Move up">
                ↑
              </button>
              <button type="button" className={styles.mediaButton} onClick={() => moveSelected(1)} title="Move down" aria-label="Move down">
                ↓
              </button>
            </>
          )}
          <button type="button" className={`${styles.mediaButton} ${styles.deleteButton}`} onClick={deleteSelected}>
            Delete
          </button>
          {editing && selectedMedia && (
            <MediaPopover
              kind={kindOf(selectedMedia)}
              label={kindOf(selectedMedia) === "image" ? "Image details" : kindOf(selectedMedia) === "video" ? "Video details" : "Audio details"}
              initial={readMeta(selected, selectedMedia)}
              onSave={saveSelectedMeta}
              onUploadCaption={kindOf(selectedMedia) === "video" ? uploadCaption : undefined}
              onClose={() => setEditing(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
