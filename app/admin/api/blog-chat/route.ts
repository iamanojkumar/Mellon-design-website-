import { streamText, tool, convertToModelMessages, stepCountIs, type UIMessage } from "ai";
import { z } from "zod";
import { clip, deepseekChat, gate, readBrandVoice, resolveLocale } from "@/lib/admin-ai";

export const maxDuration = 60;

/**
 * Blog writing assistant. proposePost has no `execute`: the editor's browser
 * applies the fields to the draft and answers, and nothing is saved until the
 * editor clicks Save. It is given the post as it stands, the brand voice, and
 * the chat so far (which the panel keeps per post). Keyword CSVs arrive inside
 * the messages, marked [[keywords:…]].
 */

const postFields = z.object({
  title: z.string().optional(),
  slug: z.string().optional(),
  summary: z.string().optional().describe("one or two sentences shown on the blog index"),
  category: z.string().optional().describe("prefer one of the existing categories"),
  content: z.string().optional().describe("post body as HTML (h2/h3/p/ul/ol/li/strong/em/a only)"),
  heroImageAlt: z.string().optional(),
  metaTitle: z.string().optional().describe("search-result title, under 60 characters"),
  metaDescription: z.string().optional().describe("search-result description, under 160 characters"),
  focusKeyword: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
});

export async function POST(request: Request) {
  const blocked = await gate();
  if (blocked) return blocked;

  const {
    messages,
    locale: requestedLocale,
    categories = [],
    current = {},
  }: {
    messages: UIMessage[];
    locale?: string;
    categories?: string[];
    current?: Record<string, unknown>;
  } = await request.json();

  const { locale, language } = resolveLocale(requestedLocale);
  const voice = await readBrandVoice();

  const result = streamText({
    model: deepseekChat(),
    // A proposal ends the turn: the editor's browser applies it, then the chat continues.
    stopWhen: stepCountIs(1),
    system: [
      "You are the writing assistant inside Mellon's admin tool. Mellon is a design agency;",
      `you help write blog posts for the ${locale} locale (${language}) and always write in that locale's language and spelling.`,
      "Use the proposePost tool whenever you write or change the post: it fills the editor draft directly and nothing is saved until the editor clicks Save. Put only the fields you want to change in it.",
      "If keyword data is attached, pick one primary phrase for the post and use the file's volumes only as evidence; never invent numbers.",
      'Never use superlatives ("best", "leading", "world-class") or buzzwords, and never invent facts, prices, results, names or sources.',
      "If a fact is needed that you were not given, write [Confirm: what is needed] in its place so the editor can fill it in.",
      categories.length
        ? `Existing categories in this locale: ${categories.join(", ")}.`
        : "There are no categories in this locale yet; suggest a short one if it helps.",
      "Body content must be simple HTML: h2, h3, p, ul, ol, li, strong, em, a.",
      "",
      "## Brand voice",
      clip(voice, 9000),
      "",
      "## The post right now",
      clip(current, 9000),
    ].join("\n"),
    messages: await convertToModelMessages(messages),
    tools: {
      proposePost: tool({
        description:
          "Write field values into the blog post draft. Only include fields you want to change.",
        inputSchema: z.object({
          note: z.string().describe("one short line telling the editor what you changed"),
          fields: postFields,
        }),
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
