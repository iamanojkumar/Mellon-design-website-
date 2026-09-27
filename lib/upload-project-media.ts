import "server-only";
import { randomUUID } from "crypto";
import sharp from "sharp";

/**
 * Media pipeline for the /admin projects editor. Two stages, both server-only:
 *
 *   1. `createProjectMediaUpload` mints a single-use, path-scoped signed URL so
 *      the browser can PUT the original file straight to the public
 *      "project-media" Storage bucket.
 *   2. `convertProjectMediaToAvif` re-encodes that object to AVIF with sharp
 *      and deletes the original, so only the compressed asset is kept.
 *
 * The file deliberately never travels through a Server Action: Next.js caps
 * Server Action bodies at 1MB by default and Vercel caps *any* function request
 * body at 4.5MB, which cannot be raised — so proxying the bytes made every
 * realistic photo or video upload fail in production while still working for
 * the tiny test files used locally. Stage 2 gets the bytes by fetching them
 * back out of Storage, which no body limit applies to.
 *
 * The service-role key never reaches the browser; it only signs a token valid
 * for one bucket, one object path, and 30 minutes. Size and MIME limits are
 * enforced on the bucket itself (see
 * supabase/migrations/20261001000000_project_media_limits.sql), because a client
 * holding a signed URL can send whatever bytes it likes — the checks here exist
 * to fail fast with a readable message, not as the security boundary.
 */

const BUCKET = "project-media";
const UPLOAD_URL_TTL_SECONDS = 60 * 30;

/** Videos are stored as uploaded; only images go through sharp. */
export const MAX_IMAGE_SIZE = 25 * 1024 * 1024;
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

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

/**
 * Raster formats worth re-encoding. `svg` is vector (rasterising it would be a
 * downgrade), `gif` may be animated (libvips cannot reliably write animated
 * AVIF), and `avif` is already in the target format — all three pass through
 * untouched.
 */
const CONVERTIBLE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

/**
 * Tuned for photography-heavy case studies: ~70% smaller than a quality-92 JPEG
 * with no visible loss. `effort: 3` is not a compromise here — measured against
 * both photographic and high-detail sources it produced *smaller* files than
 * sharp's default `effort: 4` while encoding 4-7x faster (0.5s vs 2-4s for a
 * 12MP image), which matters because the editor waits on this call.
 */
const AVIF_OPTIONS = { quality: 58, effort: 3, chromaSubsampling: "4:2:0" } as const;

/** Reverse lookup, so a pasted screenshot with no usable filename still works. */
const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/svg+xml": "svg",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/ogg": "ogg",
  "video/quicktime": "mov",
};

function extensionOf(filename: string): string {
  const match = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : "";
}

function requireEnv(): { url: string; key: string } {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set");
  }
  return { url, key };
}

function publicUrlFor(baseUrl: string, path: string): string {
  return `${baseUrl}/storage/v1/object/public/${BUCKET}/${path}`;
}

export type SignedMediaUpload = {
  /** Absolute, token-bearing URL the browser PUTs the raw file to. */
  uploadUrl: string;
  /** Where the file will be publicly readable once the PUT succeeds. */
  publicUrl: string;
  /** Content-Type the browser must send, derived from the extension. */
  contentType: string;
  /** Whether the browser should ask for AVIF conversion after the PUT. */
  convertible: boolean;
};

export async function createProjectMediaUpload({
  filename,
  size,
  type,
}: {
  filename: string;
  size: number;
  type: string;
}): Promise<SignedMediaUpload> {
  if (!Number.isFinite(size) || size <= 0) {
    throw new Error("That file is empty.");
  }

  // Trust the filename first; fall back to the browser-reported MIME type for
  // clipboard pastes, which often arrive without a meaningful name.
  const named = extensionOf(filename);
  const extension = ALLOWED_EXTENSIONS[named] ? named : EXTENSION_BY_MIME[type.toLowerCase()] ?? named;
  const contentType = ALLOWED_EXTENSIONS[extension];
  if (!contentType) {
    throw new Error(
      `Unsupported file format ".${extension || "?"}". Use one of: ${Object.keys(ALLOWED_EXTENSIONS).join(", ")}.`,
    );
  }

  const isImage = extension in IMAGE_EXTENSIONS;
  const limit = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
  if (size > limit) {
    throw new Error(
      `File is too large. Max size is ${limit / 1024 / 1024}MB for ${isImage ? "images" : "video"}.`,
    );
  }

  const { url, key } = requireEnv();
  const path = `${randomUUID()}.${extension}`;
  const response = await fetch(`${url}/storage/v1/object/upload/sign/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresIn: UPLOAD_URL_TTL_SECONDS }),
  });

  if (!response.ok) {
    throw new Error(`Could not start the upload: ${response.status} ${await response.text()}`);
  }

  // Supabase returns a root-relative path under /storage/v1, e.g.
  // "/object/upload/sign/project-media/<uuid>.png?token=…".
  const { url: signedPath } = (await response.json()) as { url?: string };
  if (!signedPath) {
    throw new Error("Could not start the upload: Supabase returned no signed URL.");
  }

  return {
    uploadUrl: `${url}/storage/v1${signedPath}`,
    publicUrl: publicUrlFor(url, path),
    contentType,
    convertible: CONVERTIBLE_EXTENSIONS.has(extension),
  };
}

/**
 * Object paths are always `<uuid>.<ext>` (see above), so anything else is not
 * ours. Keeps an authenticated admin from pointing the converter at an
 * arbitrary URL.
 */
const OBJECT_PATH = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.([a-z0-9]+)$/;

function parseOwnPublicUrl(candidate: string, baseUrl: string): { path: string; extension: string } {
  const prefix = `${baseUrl}/storage/v1/object/public/${BUCKET}/`;
  if (!candidate.startsWith(prefix)) {
    throw new Error("That file is not in the project media bucket.");
  }
  const path = candidate.slice(prefix.length);
  const match = path.match(OBJECT_PATH);
  if (!match) throw new Error("Unrecognised media path.");
  return { path, extension: match[1] };
}

export type ConvertedMedia = {
  /** AVIF URL, or the original URL when the file was left as-is. */
  publicUrl: string;
  converted: boolean;
  /** Bytes saved by the re-encode; 0 when nothing was converted. */
  savedBytes: number;
};

/**
 * Re-encodes an already-uploaded image to AVIF, replaces the object, and
 * removes the original. Never throws for image-processing reasons: a stored
 * JPEG is a far better outcome than a failed upload, so on any conversion
 * problem the original URL is returned unchanged and the caller carries on.
 */
export async function convertProjectMediaToAvif(candidateUrl: string): Promise<ConvertedMedia> {
  const { url, key } = requireEnv();
  const { path, extension } = parseOwnPublicUrl(candidateUrl, url);

  const unchanged: ConvertedMedia = { publicUrl: candidateUrl, converted: false, savedBytes: 0 };
  if (!CONVERTIBLE_EXTENSIONS.has(extension)) return unchanged;

  const authHeaders = { apikey: key, Authorization: `Bearer ${key}` };

  try {
    const source = await fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, { headers: authHeaders });
    if (!source.ok) {
      console.error("[admin] AVIF convert: could not read original", source.status);
      return unchanged;
    }

    const original = Buffer.from(await source.arrayBuffer());
    // `rotate()` with no argument bakes in EXIF orientation, which AVIF output
    // would otherwise drop — without it, phone photos come out sideways.
    const avif = await sharp(original, { failOn: "none" })
      .rotate()
      .avif(AVIF_OPTIONS)
      .toBuffer();

    // A re-encode that grows the file (already-optimised or tiny PNGs, flat
    // graphics) is not worth taking, and would silently make pages heavier.
    if (avif.byteLength >= original.byteLength) return unchanged;

    const avifPath = `${path.slice(0, path.lastIndexOf("."))}.avif`;
    const upload = await fetch(`${url}/storage/v1/object/${BUCKET}/${avifPath}`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "image/avif", "x-upsert": "true" },
      body: new Uint8Array(avif),
    });
    if (!upload.ok) {
      console.error("[admin] AVIF convert: upload failed", upload.status, await upload.text());
      return unchanged;
    }

    // Only now is the original redundant. A failure here just leaves an orphan.
    const removed = await fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    if (!removed.ok) {
      console.error("[admin] AVIF convert: could not remove original", path, removed.status);
    }

    return {
      publicUrl: publicUrlFor(url, avifPath),
      converted: true,
      savedBytes: original.byteLength - avif.byteLength,
    };
  } catch (error) {
    console.error("[admin] AVIF convert failed, keeping original", error);
    return unchanged;
  }
}
