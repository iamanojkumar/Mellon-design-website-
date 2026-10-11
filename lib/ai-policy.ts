/**
 * One list of AI crawlers and one list of media paths, shared by robots.txt,
 * the response headers (next.config.ts) and the audio route. Text pages stay
 * open to these agents; media does not.
 *
 * robots.txt and these headers only bind crawlers that honour them. The audio
 * route additionally refuses these user agents outright.
 */
export const AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-Web",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "Google-Extended",
  "GoogleOther",
  "Applebot-Extended",
  "PerplexityBot",
  "Perplexity-User",
  "CCBot",
  "Bytespider",
  "Amazonbot",
  "meta-externalagent",
  "FacebookBot",
  "Diffbot",
  "cohere-ai",
  "Omgilibot",
  "ImagesiftBot",
  "Timpibot",
  "YouBot",
  "Ai2Bot",
  "DuckAssistBot",
  "MistralAI-User",
] as const;

/** Media an AI agent must not fetch. Paths are robots.txt patterns. */
export const AI_MEDIA_DISALLOW = [
  "/api/media/",
  "/_next/image",
  "/images/",
  "/brand/",
  "/*.mp3$",
  "/*.m4a$",
  "/*.aac$",
  "/*.wav$",
  "/*.oga$",
  "/*.weba$",
  "/*.mp4$",
  "/*.webm$",
  "/*.mov$",
  "/*.gif$",
  "/*.png$",
  "/*.jpg$",
  "/*.jpeg$",
  "/*.webp$",
  "/*.avif$",
];

const AI_UA = new RegExp(AI_CRAWLERS.map((name) => name.replace(/[-.]/g, "\$&")).join("|"), "i");

export function isAiAgent(userAgent: string | null): boolean {
  return !!userAgent && AI_UA.test(userAgent);
}

/** Response headers that reserve media from AI training (noai, TDM). */
export const MEDIA_RIGHTS_HEADERS = [
  { key: "X-Robots-Tag", value: "noai, noimageai" },
  { key: "TDM-Reservation", value: "1" },
  { key: "TDM-Policy", value: "/ai.txt" },
];
