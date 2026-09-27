import "server-only";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * DeepSeek for the admin assistant, through the AI SDK's OpenAI-compatible
 * provider (DeepSeek exposes an OpenAI-shaped API, tool calling included).
 * Same key as lib/translate.ts — server-only, never sent to the browser.
 */

export function isAssistantConfigured(): boolean {
  return Boolean(process.env.DEEPSEEK_API_KEY);
}

export function deepseekChat() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY is not set");

  return createOpenAICompatible({
    name: "deepseek",
    apiKey,
    baseURL: "https://api.deepseek.com",
  }).chatModel("deepseek-chat");
}
