import { streamText, tool, convertToModelMessages, stepCountIs, type UIMessage } from "ai";
import { z } from "zod";
import { deepseekChat, isAssistantConfigured } from "@/lib/ai-provider";
import { isAdminAuthed } from "@/lib/admin-auth";
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
  if (!(await isAdminAuthed())) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!isAssistantConfigured()) {
    return new Response("Set DEEPSEEK_API_KEY to enable the assistant.", { status: 501 });
  }

  const {
    messages,
    locale: requestedLocale,
  }: { messages: UIMessage[]; locale?: string } = await request.json();

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
      "Use the proposeProject tool when the editor wants one project written, filled in or improved.",
      "Use the proposeBulkProjects tool when they ask for several projects at once.",
      "Never claim you saved anything: your proposals only appear in the editor once the user applies them.",
      `Valid category slugs: ${categories}.`,
      `Valid service slugs: ${services}.`,
      "Only ever use slugs from those lists. Body content must be simple HTML: h2, h3, p, ul/li, strong, em.",
    ].join(" "),
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
