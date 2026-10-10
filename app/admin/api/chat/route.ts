import { streamText, tool, convertToModelMessages, stepCountIs, type UIMessage } from "ai";
import { z } from "zod";
import { clip, deepseekChat, gate, readBrandVoice } from "@/lib/admin-ai";
import { getIndustries, getServices } from "@/lib/content";
import { isEnabledLocale, defaultLocale } from "@/lib/locale";
import { SCHEMA_TYPES, PROJECT_STATUSES } from "@/lib/project-fields";

export const maxDuration = 60;

/**
 * Admin assistant. Both tools are declared WITHOUT an `execute`, so the model
 * can only ever *propose* — the tool call surfaces in the UI and nothing
 * reaches the database until the editor clicks Apply/Create. That keeps a
 * human checkpoint in front of every write, including bulk ones.
 */

const projectFields = z.object({
  title: z.string().optional(),
  slug: z.string().optional(),
  summary: z.string().optional(),
  category: z.string().optional().describe("industry slug from the provided list"),
  service: z.string().optional().describe("service slug from the provided list"),
  content: z.string().optional().describe("case-study body as HTML (h2/h3/p/ul/strong only)"),
  featured: z.boolean().optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
  heroImageAlt: z.string().optional().describe("describes the hero image for screen readers"),
  metaTitle: z.string().optional().describe("search-result title, aim for under 60 characters"),
  metaDescription: z
    .string()
    .optional()
    .describe("search-result description, aim for under 160 characters"),
  focusKeyword: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  schemaType: z.enum(SCHEMA_TYPES).optional(),
});

export async function POST(request: Request) {
  const blocked = await gate();
  if (blocked) return blocked;

  const {
    messages,
    locale: requestedLocale,
    current = {},
  }: { messages: UIMessage[]; locale?: string; current?: Record<string, unknown> } =
    await request.json();
  const voice = await readBrandVoice();

  const locale = requestedLocale && isEnabledLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const categories = getIndustries(locale).map((i) => `${i.slug} (${i.name})`).join(", ");
  const services = getServices(locale).map((s) => `${s.slug} (${s.name})`).join(", ");

  const result = streamText({
    model: deepseekChat(),
    // Tool calls end the turn here: the user has to act on the proposal before
    // the conversation continues, so there is no multi-step loop to run.
    stopWhen: stepCountIs(1),
    system: [
      "You are the editorial assistant inside Mellon's admin tool. Mellon is a design agency;",
      `you are helping write portfolio case studies for the ${locale} locale — always write copy in that locale's language.`,
      "Use the proposeProject tool when the editor wants one project written, filled in or improved: it fills the editor draft directly, and nothing is saved until the editor clicks Save.",
      "If keyword data is attached, use the file's volumes only as evidence and never invent numbers. Never invent client names, results or dates; write [Confirm: what is needed] where a fact is missing.",
      "Use the proposeBulkProjects tool when they ask for several projects at once.",
      "Never claim you saved anything: nothing is saved until the editor clicks Save (bulk creation needs the editor to confirm).",
      `Valid category slugs: ${categories}.`,
      `Valid service slugs: ${services}.`,
      "Only ever use slugs from those lists. Body content must be simple HTML: h2, h3, p, ul/li, strong, em.",
      "",
      "## Brand voice",
      clip(voice, 9000),
      "",
      "## The project open in the editor right now",
      clip(current, 9000),
    ].join("\n"),
    messages: await convertToModelMessages(messages),
    tools: {
      proposeProject: tool({
        description:
          "Propose field values for the project currently open in the editor. Only include fields you actually want to change.",
        inputSchema: z.object({
          note: z.string().describe("one short line telling the editor what you changed"),
          fields: projectFields,
        }),
      }),
      proposeBulkProjects: tool({
        description:
          "Propose several new projects to create at once. Each needs at least a title, category and service.",
        inputSchema: z.object({
          note: z.string().describe("one short line summarising the batch"),
          projects: z.array(projectFields).min(1).max(25),
        }),
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
