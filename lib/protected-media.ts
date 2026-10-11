import "server-only";

/**
 * Audio is not handed to the browser as a storage URL. The page gets
 * /api/media/audio/<path> instead, which only answers requests that come from
 * an audio/video element on this site (see the route). The storage URL never
 * appears in the HTML, so a scraper reading the page has nothing to fetch.
 *
 * This is a deterrent, not DRM: anything a browser can play, a determined
 * person can capture.
 */
const BUCKET_PATH = "/storage/v1/object/public/project-media/";
const AUDIO_FILE = /\.(mp3|m4a|aac|wav|oga|weba)$/i;

export const AUDIO_ROUTE = "/api/media/audio/";

export function protectedAudioSrc(url: string): string {
  const base = process.env.SUPABASE_URL;
  if (!base || !url.startsWith(`${base}${BUCKET_PATH}`)) return url;
  const path = url.slice(`${base}${BUCKET_PATH}`.length).split(/[?#]/)[0];
  return AUDIO_FILE.test(path) ? `${AUDIO_ROUTE}${path}` : url;
}

/** Rewrites storage audio URLs inside authored article HTML. */
export function protectAudioInHtml(html: string): string {
  return html.replace(/(<audio\b[^>]*?\bsrc=)(["'])(.*?)\2/gi, (_m, head, quote, src) => {
    return `${head}${quote}${protectedAudioSrc(src)}${quote}`;
  });
}
