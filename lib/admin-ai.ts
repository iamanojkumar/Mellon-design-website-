import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { deepseekChat, isAssistantConfigured } from "@/lib/ai-provider";
import { isAdminAuthed } from "@/lib/admin-auth";
import { defaultLocale, getLocaleConfig, isEnabledLocale } from "@/lib/locale";

/**
 * Shared plumbing for the admin assistant routes (/admin/api/*-chat): auth and
 * configuration gates, the locale, and the rule documents every assistant reads.
 */

export { deepseekChat };

/** 401/501 responses, or null when the request may proceed. */
export async function gate(): Promise<Response | null> {
  if (!(await isAdminAuthed())) return new Response("Unauthorized", { status: 401 });
  if (!isAssistantConfigured()) {
    return new Response("Set DEEPSEEK_API_KEY to enable the assistant.", { status: 501 });
  }
  return null;
}

export function resolveLocale(requested?: string) {
  const locale = requested && isEnabledLocale(requested) ? requested : defaultLocale;
  return { locale, language: getLocaleConfig(locale)?.label ?? locale };
}

/** Reads a repo document at request time; traced into the function by next.config. */
async function readDoc(file: string): Promise<string> {
  try {
    return await readFile(path.join(process.cwd(), "docs", file), "utf8");
  } catch {
    return "";
  }
}

export const readBrandVoice = () => readDoc("brand-voice.md");
export const readLandingRules = () => readDoc("landing-rules.md");

/** Caps a context value so a huge page cannot crowd out the conversation. */
export function clip(value: unknown, max = 6000): string {
  const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  return text.length > max ? `${text.slice(0, max)}\n…[truncated]` : text;
}
