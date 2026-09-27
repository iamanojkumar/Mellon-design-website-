"use client";

import { useState } from "react";
import {
  BLOCK_TYPES,
  createBlock,
  type ProjectBlock,
  type ProjectBlockType,
} from "@/lib/project-blocks";
import styles from "./BlocksEditor.module.css";

/**
 * Ordered list of designed sections that sit alongside the rich-text body.
 * Reordering is up/down buttons rather than drag-and-drop on purpose — this is
 * a dense internal tool and a DnD library is bundle weight for little gain.
 */
export function BlocksEditor({
  blocks,
  onChange,
  onUploadFile,
}: {
  blocks: ProjectBlock[];
  onChange: (blocks: ProjectBlock[]) => void;
  onUploadFile: (file: File) => Promise<string>;
}) {
  const [adding, setAdding] = useState(false);

  const update = (index: number, next: ProjectBlock) =>
    onChange(blocks.map((block, i) => (i === index ? next : block)));

  const remove = (index: number) => onChange(blocks.filter((_, i) => i !== index));

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const add = (type: ProjectBlockType) => {
    onChange([...blocks, createBlock(type)]);
    setAdding(false);
  };

  return (
    <div className={styles.wrapper}>
      {blocks.map((block, index) => {
        const meta = BLOCK_TYPES.find((entry) => entry.type === block.type);
        return (
          <section key={index} className={styles.block}>
            <header className={styles.blockHead}>
              <span className={styles.blockType}>{meta?.label ?? block.type}</span>
              <span className={styles.blockNote}>{meta?.schemaNote}</span>
              <span className={styles.blockActions}>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => move(index, 1)}
                  disabled={index === blocks.length - 1}
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => remove(index)}
                  title="Remove block"
                >
                  ✕
                </button>
              </span>
            </header>

            <BlockFields
              block={block}
              onChange={(next) => update(index, next)}
              onUploadFile={onUploadFile}
            />
          </section>
        );
      })}

      {adding ? (
        <div className={styles.addRow}>
          {BLOCK_TYPES.map((entry) => (
            <button
              key={entry.type}
              type="button"
              className="a-btn"
              onClick={() => add(entry.type)}
              title={entry.schemaNote}
            >
              {entry.label}
            </button>
          ))}
          <button type="button" className="a-btn" onClick={() => setAdding(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <button type="button" className="a-btn" onClick={() => setAdding(true)}>
          + Add block
        </button>
      )}
    </div>
  );
}

function BlockFields({
  block,
  onChange,
  onUploadFile,
}: {
  block: ProjectBlock;
  onChange: (block: ProjectBlock) => void;
  onUploadFile: (file: File) => Promise<string>;
}) {
  switch (block.type) {
    case "faq":
      return (
        <RepeatingRows
          heading={block.heading}
          onHeading={(heading) => onChange({ ...block, heading })}
          rows={block.items}
          onRows={(items) => onChange({ ...block, items })}
          blank={{ question: "", answer: "" }}
          addLabel="+ Question"
          render={(item, set) => (
            <>
              <input
                className="a-input"
                placeholder="Question"
                value={item.question}
                onChange={(event) => set({ ...item, question: event.target.value })}
              />
              <textarea
                className="a-input"
                rows={2}
                placeholder="Answer"
                value={item.answer}
                onChange={(event) => set({ ...item, answer: event.target.value })}
              />
            </>
          )}
        />
      );

    case "stats":
      return (
        <RepeatingRows
          heading={block.heading}
          onHeading={(heading) => onChange({ ...block, heading })}
          rows={block.items}
          onRows={(items) => onChange({ ...block, items })}
          blank={{ value: "", label: "" }}
          addLabel="+ Stat"
          render={(item, set) => (
            <div className={styles.pair}>
              <input
                className="a-input"
                placeholder="+42%"
                value={item.value}
                onChange={(event) => set({ ...item, value: event.target.value })}
              />
              <input
                className="a-input"
                placeholder="Conversion rate"
                value={item.label}
                onChange={(event) => set({ ...item, label: event.target.value })}
              />
            </div>
          )}
        />
      );

    case "testimonial":
      return (
        <div className={styles.fields}>
          <textarea
            className="a-input"
            rows={3}
            placeholder="Quote"
            value={block.quote}
            onChange={(event) => onChange({ ...block, quote: event.target.value })}
          />
          <div className={styles.triple}>
            <input
              className="a-input"
              placeholder="Name"
              value={block.author}
              onChange={(event) => onChange({ ...block, author: event.target.value })}
            />
            <input
              className="a-input"
              placeholder="Role"
              value={block.role}
              onChange={(event) => onChange({ ...block, role: event.target.value })}
            />
            <input
              className="a-input"
              placeholder="Company"
              value={block.company}
              onChange={(event) => onChange({ ...block, company: event.target.value })}
            />
          </div>
        </div>
      );

    case "gallery":
      return (
        <RepeatingRows
          heading={block.heading}
          onHeading={(heading) => onChange({ ...block, heading })}
          rows={block.images}
          onRows={(images) => onChange({ ...block, images })}
          blank={{ src: "", alt: "" }}
          addLabel="+ Image"
          render={(image, set) => (
            <div className={styles.pair}>
              <ImageField
                value={image.src}
                onChange={(src) => set({ ...image, src })}
                onUploadFile={onUploadFile}
              />
              <input
                className="a-input"
                placeholder="Alt text"
                value={image.alt}
                onChange={(event) => set({ ...image, alt: event.target.value })}
              />
            </div>
          )}
        />
      );

    case "video":
      return (
        <div className={styles.fields}>
          <input
            className="a-input"
            placeholder="Video URL"
            value={block.url}
            onChange={(event) => onChange({ ...block, url: event.target.value })}
          />
          <input
            className="a-input"
            placeholder="Title"
            value={block.title}
            onChange={(event) => onChange({ ...block, title: event.target.value })}
          />
          <textarea
            className="a-input"
            rows={2}
            placeholder="Description"
            value={block.description}
            onChange={(event) => onChange({ ...block, description: event.target.value })}
          />
          <div className={styles.pair}>
            <ImageField
              value={block.thumbnail}
              onChange={(thumbnail) => onChange({ ...block, thumbnail })}
              onUploadFile={onUploadFile}
            />
            <label className={styles.inlineLabel}>
              <span className="a-hint">Upload date</span>
              <input
                className="a-input"
                type="date"
                value={block.uploadDate}
                onChange={(event) => onChange({ ...block, uploadDate: event.target.value })}
              />
            </label>
          </div>
          <span className="a-hint">
            VideoObject needs a title, thumbnail and upload date to be eligible.
          </span>
        </div>
      );
  }
}

function ImageField({
  value,
  onChange,
  onUploadFile,
}: {
  value: string;
  onChange: (src: string) => void;
  onUploadFile: (file: File) => Promise<string>;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <span className={styles.imageField}>
      <input
        className="a-input"
        placeholder="Image URL"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <label className={`a-btn ${styles.uploadLabel}`}>
        {busy ? "…" : "Upload"}
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            setBusy(true);
            try {
              onChange(await onUploadFile(file));
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
    </span>
  );
}

/** Heading + an add/remove list, shared by faq, stats and gallery. */
function RepeatingRows<T>({
  heading,
  onHeading,
  rows,
  onRows,
  blank,
  addLabel,
  render,
}: {
  heading: string;
  onHeading: (heading: string) => void;
  rows: T[];
  onRows: (rows: T[]) => void;
  blank: T;
  addLabel: string;
  render: (row: T, set: (row: T) => void) => React.ReactNode;
}) {
  return (
    <div className={styles.fields}>
      <input
        className="a-input"
        placeholder="Section heading (optional)"
        value={heading}
        onChange={(event) => onHeading(event.target.value)}
      />
      {rows.map((row, index) => (
        <div key={index} className={styles.row}>
          <div className={styles.rowFields}>
            {render(row, (next) => onRows(rows.map((r, i) => (i === index ? next : r))))}
          </div>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => onRows(rows.filter((_, i) => i !== index))}
            title="Remove"
          >
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="a-btn" onClick={() => onRows([...rows, blank])}>
        {addLabel}
      </button>
    </div>
  );
}
