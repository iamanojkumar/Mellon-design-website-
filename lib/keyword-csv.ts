/**
 * Keyword CSVs shared with the admin assistant (Search Console exports, keyword
 * planner exports, the files in docs/keyword-research). Client-safe: parsing
 * happens in the browser and only a compact, capped summary is sent with the
 * next message, so a 20,000-row export cannot flood the conversation.
 */

export type KeywordFile = {
  name: string;
  /** Rows in the file (excluding the header). */
  totalRows: number;
  /** Rows included in `block`, highest volume first. */
  shownRows: number;
  /** The text sent to the assistant. */
  block: string;
};

const MAX_ROWS = 150;
const MAX_CHARS = 12000;
const MAX_COLUMNS = 5;

/** Splits CSV text into rows of cells; handles quoted cells, doubled quotes and CRLF. */
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const text = input.replace(/^﻿/, "");

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === "," || char === "\t" || char === ";") {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
}

const toNumber = (value: string | undefined) => {
  if (!value) return NaN;
  const n = Number(value.replace(/[,\s%]/g, ""));
  return Number.isFinite(n) ? n : NaN;
};

/** Turns CSV text into the capped block sent to the assistant. */
export function summariseKeywordCsv(name: string, text: string): KeywordFile {
  const rows = parseCsv(text);
  if (rows.length === 0) return { name, totalRows: 0, shownRows: 0, block: "" };

  // A header row has no purely numeric cells.
  const hasHeader = rows[0].every((cell) => Number.isNaN(toNumber(cell)));
  const header = hasHeader ? rows[0].map((cell) => cell.trim()) : rows[0].map((_, i) => `col${i + 1}`);
  const body = hasHeader ? rows.slice(1) : rows;

  const find = (pattern: RegExp) => header.findIndex((cell) => pattern.test(cell));
  const keywordCol = Math.max(0, find(/keyword|query|search term|phrase|term/i));
  const volumeCol = find(/volume|searches|avg|impressions|clicks/i);

  // Keyword first, volume second, then the next columns in file order.
  const order = [keywordCol, ...(volumeCol >= 0 && volumeCol !== keywordCol ? [volumeCol] : [])];
  for (let i = 0; i < header.length && order.length < MAX_COLUMNS; i++) {
    if (!order.includes(i)) order.push(i);
  }

  const sorted =
    volumeCol >= 0
      ? [...body].sort((a, b) => (toNumber(b[volumeCol]) || 0) - (toNumber(a[volumeCol]) || 0))
      : body;

  const lines = [order.map((i) => header[i]).join(" | ")];
  let size = lines[0].length;
  for (const row of sorted.slice(0, MAX_ROWS)) {
    const line = order.map((i) => (row[i] ?? "").trim()).join(" | ");
    if (size + line.length > MAX_CHARS) break;
    lines.push(line);
    size += line.length + 1;
  }

  return { name, totalRows: body.length, shownRows: lines.length - 1, block: lines.join("\n") };
}

// ---------------------------------------------------------------------------
// Embedding in a message. The block travels as plain text (the model takes no
// file parts), wrapped in markers so the chat can show it as a chip instead of
// a wall of rows.
// ---------------------------------------------------------------------------

export function wrapKeywordFiles(files: KeywordFile[]): string {
  return files
    .map(
      (file) =>
        `[[keywords:${file.name}|${file.shownRows}/${file.totalRows}]]\n${file.block}\n[[/keywords]]`,
    )
    .join("\n\n");
}

const MARKED = /\[\[keywords:([^|\]]*)\|(\d+)\/(\d+)\]\]\n[\s\S]*?\n\[\[\/keywords\]\]/g;

/** Splits a stored message into its keyword attachments and the text around them. */
export function splitKeywordBlocks(text: string): {
  text: string;
  files: { name: string; shown: number; total: number }[];
} {
  const files: { name: string; shown: number; total: number }[] = [];
  const rest = text.replace(MARKED, (_match, name, shown, total) => {
    files.push({ name, shown: Number(shown), total: Number(total) });
    return "";
  });
  return { text: rest.trim(), files };
}
