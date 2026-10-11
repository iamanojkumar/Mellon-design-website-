import { NextRequest } from "next/server";
import { isAiAgent, MEDIA_RIGHTS_HEADERS } from "@/lib/ai-policy";

/**
 * Streams narration audio from the project-media bucket, only to a player on
 * this site. Refused: AI user agents, direct navigation, and requests with no
 * sign they came from an <audio>/<video> element here (plain curl, scrapers).
 * Range requests pass through so seeking works.
 *
 * Headers can be forged, so this stops casual and automated downloading, not a
 * determined person. Never an open proxy: only audio files in one bucket.
 */
export const dynamic = "force-dynamic";

const BUCKET_PATH = "/storage/v1/object/public/project-media/";
const AUDIO_FILE = /\.(mp3|m4a|aac|wav|oga|weba)$/i;
const SAFE_PATH = /^[A-Za-z0-9][A-Za-z0-9._\-/]*$/;

function refuse(status: number) {
  return new Response(null, {
    status,
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, noai, noimageai" },
  });
}

function fromOurPlayer(request: NextRequest): boolean {
  const dest = request.headers.get("sec-fetch-dest");
  const site = request.headers.get("sec-fetch-site");
  if (dest) return (dest === "audio" || dest === "video") && site === "same-origin";
  // Browsers without Fetch Metadata: fall back to the Referer.
  const referer = request.headers.get("referer");
  if (!referer) return false;
  try {
    return new URL(referer).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  if (isAiAgent(request.headers.get("user-agent"))) return refuse(403);
  if (!fromOurPlayer(request)) return refuse(403);

  const base = process.env.SUPABASE_URL;
  const path = (await params).path.join("/");
  if (!base || !SAFE_PATH.test(path) || path.includes("..") || !AUDIO_FILE.test(path)) {
    return refuse(404);
  }

  const range = request.headers.get("range");
  const upstream = await fetch(`${base}${BUCKET_PATH}${path}`, {
    headers: range ? { Range: range } : undefined,
  });
  if (!upstream.ok && upstream.status !== 206) return refuse(404);

  const headers = new Headers({
    "Content-Type": upstream.headers.get("content-type") ?? "audio/mpeg",
    "Content-Disposition": "inline",
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, no-store",
    "Cross-Origin-Resource-Policy": "same-origin",
    "X-Content-Type-Options": "nosniff",
  });
  for (const name of ["content-length", "content-range"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  for (const { key, value } of MEDIA_RIGHTS_HEADERS) headers.set(key, value);

  return new Response(upstream.body, { status: upstream.status, headers });
}
