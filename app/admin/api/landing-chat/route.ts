import { streamText, tool, convertToModelMessages, stepCountIs, type UIMessage } from "ai";
import { z } from "zod";
import { clip, deepseekChat, gate, readBrandVoice, readLandingRules, resolveLocale } from "@/lib/admin-ai";
import {
  checkLandingRules,
  coerceLandingCopy,
  describeRuleResults,
  landingPatchSchema,
  type LandingCopy,
} from "@/lib/landing-content";
import { getOtherLandingPages } from "@/lib/landing-others";
import { getServices } from "@/lib/content";

export const maxDuration = 60;

/**
 * Landing page assistant. It writes straight into the editor draft: the
 * proposeLanding tool has no `execute`, the browser applies it and answers, and
 * nothing is saved or published until the editor clicks Save and sets the status.
 *
 * Context it is given on every request: the brand voice and the landing-page
 * rules (docs/), the services and the landing pages that already exist (to keep
 * intent and metadata unique), the page as it stands right now, and the live
 * result of the rule checks on that draft. Keyword CSVs arrive inside the chat
 * messages themselves, marked [[keywords:…]].
 */

type Current = {
  id?: string | null;
  slug?: string;
  service?: string;
  indexable?: boolean;
  demandNote?: string;
  locales?: string[];
  copy?: unknown;
};

export async function POST(request: Request) {
  const blocked = await gate();
  if (blocked) return blocked;

  const {
    messages,
    locale: requestedLocale,
    current = {},
  }: { messages: UIMessage[]; locale?: string; current?: Current } = await request.json();

  const { locale, language } = resolveLocale(requestedLocale);
  const copy: LandingCopy = coerceLandingCopy(current.copy);

  const [voice, rules, others] = await Promise.all([
    readBrandVoice(),
    readLandingRules(),
    getOtherLandingPages(current.id ?? null).catch(() => []),
  ]);

  const checks = checkLandingRules({
    copy,
    slug: current.slug ?? "",
    indexable: current.indexable ?? true,
    demandNote: current.demandNote ?? "",
    others,
  });

  const services = getServices(locale).map((s) => `${s.slug} (${s.name})`).join(", ");
  const existing = others
    .map((o) => `- /${o.slug}: "${o.headline}" | ${o.metaTitle}`)
    .join("\n");

  const system = [
    "You are the landing page assistant inside Mellon's admin tool. Mellon is a design agency.",
    `You are building a landing page for the ${locale} locale (${language}). Write all copy in that locale's language and spelling.`,
    "The page uses a fixed layout; you only supply content. You write it by calling the proposeLanding tool, which fills the editor draft directly. Nothing is saved or published until the editor clicks Save.",
    "Work like this: (1) if keyword CSV data is attached, choose ONE primary search phrase for this page's single intent, list its close variants, and use the volumes in the file as the demand evidence; never invent a number. (2) Pick an intent that no existing page serves. (3) Call proposeLanding with the complete content, then say in one or two lines what you wrote and which rule checks, if any, still need the editor's input.",
    "When asked for changes, send only the fields that change; arrays (steps, items, FAQs) are replaced as a whole, so include every entry you want to keep.",
    "Always set demandNote: the primary phrase, market, the volumes from the file (or 'Unknown' if none was shared), and a verdict of Demand confirmed, Low or Unknown. If the verdict is Low or Unknown, say so plainly in your reply and recommend building the page non-indexable.",
    "Never invent facts: prices, timelines, results, clients, awards. Where a fact is needed and you were not given it, write [Confirm: what is needed] and tell the editor.",
    "Aim to pass every rule check below. The indexable page needs at least 300 words of body copy across the summary, steps, items, FAQs and quote text.",
    "",
    "## Brand voice",
    clip(voice, 9000),
    "",
    "## Landing page rules",
    clip(rules, 9000),
    "",
    `## Services in this locale (use one slug for the page's service field)\n${services}`,
    "",
    `## Landing pages that already exist (do not repeat their intent or wording)\n${clip(existing || "(none yet)", 5000)}`,
    "",
    "## The page right now",
    clip(
      {
        slug: current.slug ?? "",
        service: current.service ?? "",
        indexable: current.indexable ?? true,
        servedInLocales: current.locales ?? [locale],
        demandNote: current.demandNote ?? "",
        copy,
      },
      9000,
    ),
    "",
    "## Rule check results for this draft (fix every FAIL, address WARN where you can)",
    describeRuleResults(checks),
  ].join("\n");

  const result = streamText({
    model: deepseekChat(),
    // A proposal ends the turn: the editor's browser applies it, then the chat continues.
    stopWhen: stepCountIs(1),
    system,
    messages: await convertToModelMessages(messages),
    tools: {
      proposeLanding: tool({
        description:
          "Write content into the landing page draft. Include only the fields you want to set or change.",
        inputSchema: z.object({
          note: z.string().describe("one short line telling the editor what you wrote or changed"),
          slug: z.string().optional().describe("URL slug: lowercase words joined by hyphens, containing the target phrase"),
          service: z.string().optional().describe("a service slug from the list above"),
          demandNote: z.string().optional(),
          copy: landingPatchSchema.optional(),
        }),
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
