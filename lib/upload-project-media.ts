import "server-only";
import { randomUUID } from "crypto";

/**
 * Uploads hero images and rich-content media for the /admin projects editor.
 * Server-only: goes straight to the Supabase Storage REST API with the
 * service-role key (the "project-media" bucket, created in
 * supabase/migrations/20260927000000_projects.sql). Never exposes the key or
 * an anon-key upload path to the browser — the browser only ever posts the
 * raw file to a Server Action, which does this upload and returns a URL.
 */

const BUCKET = "project-media";
const MAX_FILE_SIZE = 50 * 1024 * 1024;

const IMAGE_EXTENSIONS: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  svg: "image/svg+xml",
};

const VIDEO_EXTENSIONS: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  ogg: "video/ogg",
  ogv: "video/ogg",
  mov: "video/quicktime",
};

const ALLOWED_EXTENSIONS = { ...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS };

function extensionOf(filename: string): string {
  const match = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : "";
}

export async function uploadProjectMedia(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File is too large. Max size is 50MB.");
  }

  const extension = extensionOf(file.name);
  const mimeType = ALLOWED_EXTENSIONS[extension];
  if (!mimeType) {
    throw new Error(
      `Unsupported file format ".${extension || "?"}". Use one of: ${Object.keys(ALLOWED_EXTENSIONS).join(", ")}.`,
    );
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set");
  }

  const path = `${randomUUID()}.${extension}`;
  const response = await fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": mimeType,
      "x-upsert": "false",
    },
    body: await file.arrayBuffer(),
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status} ${await response.text()}`);
  }

  return `${url}/storage/v1/object/public/${BUCKET}/${path}`;
}
