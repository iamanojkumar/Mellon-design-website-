import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Cloudflare Turnstile, server side. Every protected handler calls
 * `verifyTurnstile` with the token the browser sent and the action its widget
 * was rendered with; a request passes only if siteverify says success, the
 * action matches, and the page hostname is one we expect. Anything else
 * (missing config, network error, bad token) fails closed.
 *
 * Env (server-only except the sitekey, see .env.example):
 *   TURNSTILE_SECRET     the widget's secret key
 *   TURNSTILE_HOSTNAMES  comma-separated hostnames the widget may be served from
 *                        (production: mellon.design,www.mellon.design; never
 *                        localhost there. Locally: localhost)
 */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileAction = "contact" | "assistant";

export function clientIp(headers: Headers): string | undefined {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;
}

export async function verifyTurnstile(
  token: unknown,
  { action, ip }: { action: TurnstileAction; ip?: string },
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET;
  const hostnames = new Set(
    (process.env.TURNSTILE_HOSTNAMES ?? "")
      .split(",")
      .map((hostname) => hostname.trim())
      .filter(Boolean),
  );
  if (!secret || hostnames.size === 0) {
    console.error("[turnstile] TURNSTILE_SECRET / TURNSTILE_HOSTNAMES are not set; rejecting");
    return false;
  }
  if (typeof token !== "string" || token.length === 0 || token.length > 2048) return false;

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!response.ok) return false;
    const result = (await response.json()) as { success?: boolean; action?: string; hostname?: string };
    return result.success === true && result.action === action && hostnames.has(result.hostname ?? "");
  } catch {
    return false;
  }
}

/**
 * The assistant chat is verified once per conversation, not once per message:
 * a passed check sets this signed, short-lived cookie, and later messages just
 * present it. It proves "a Turnstile check passed recently", nothing else, and
 * is scoped to /api/assistant.
 */
const CHAT_COOKIE = "mellon_chat_ok";
const CHAT_TTL_SECONDS = 2 * 60 * 60;

function chatSignature(expires: number): string | null {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) return null;
  return createHmac("sha256", secret).update(`assistant:${expires}`).digest("hex");
}

export function hasChatSession(request: Request): boolean {
  const raw = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${CHAT_COOKIE}=`));
  if (!raw) return false;
  const [expiresText, signature] = raw.slice(CHAT_COOKIE.length + 1).split(".");
  const expires = Number(expiresText);
  if (!Number.isFinite(expires) || expires < Date.now() / 1000 || !signature) return false;
  const expected = chatSignature(expires);
  if (!expected || expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function chatSessionCookie(): string | null {
  const expires = Math.floor(Date.now() / 1000) + CHAT_TTL_SECONDS;
  const signature = chatSignature(expires);
  if (!signature) return null;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${CHAT_COOKIE}=${expires}.${signature}; Path=/api/assistant; Max-Age=${CHAT_TTL_SECONDS}; HttpOnly; SameSite=Lax${secure}`;
}
