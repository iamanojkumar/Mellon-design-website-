import "server-only";

/**
 * Machine translation for the /admin "duplicate to locale" action, via
 * DeepSeek's OpenAI-compatible chat completions API. Server-only: the key
 * never reaches the client. If DEEPSEEK_API_KEY isn't set, callers should
 * surface that as a clear error rather than duplicating untranslated content.
 */

export type TranslatableProjectFields = {
  title: string;
  summary: string | null;
  content: string;
};

export function isTranslationConfigured(): boolean {
  return Boolean(process.env.DEEPSEEK_API_KEY);
}

export async function translateProjectFields(
  fields: TranslatableProjectFields,
  targetLanguageName: string,
): Promise<TranslatableProjectFields> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not set");
  }

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            `Translate the JSON object's "title", "summary", and "content" fields into ${targetLanguageName}. ` +
            `"content" contains HTML — preserve every tag and attribute exactly, translating only the text nodes. ` +
            `"summary" may be null; if so, return it as null. Reply with only a JSON object with the same three keys.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            title: fields.title,
            summary: fields.summary,
            content: fields.content,
          }),
        },
      ],
      temperature: 0,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek translation failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content;
  if (typeof raw !== "string") {
    throw new Error("DeepSeek translation returned no content");
  }

  let parsed: Partial<TranslatableProjectFields>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("DeepSeek translation returned invalid JSON");
  }

  if (typeof parsed.title !== "string" || typeof parsed.content !== "string") {
    throw new Error("DeepSeek translation response is missing required fields");
  }

  return {
    title: parsed.title,
    summary: typeof parsed.summary === "string" ? parsed.summary : null,
    content: parsed.content,
  };
}
