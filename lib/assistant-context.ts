import "server-only";
import { getServices } from "@/lib/content";
import { getLandingPage } from "@/lib/landing-pages";
import { getEngagements, getServicePricing } from "@/lib/pricing";

/**
 * Published prices for the quick-chat assistant (app/api/assistant). Only what
 * the site already shows: the plan bands from the service pages, formatted in
 * the visitor's market currency. A locale with no pricing returns "", and the
 * assistant then quotes nothing.
 *
 * On a service page (or a landing page tied to a service) it lists that
 * service's plans in full; elsewhere, a one-line-per-service overview.
 */

function serviceSlugFromPath(path: string, locale: string): string | undefined {
  const segments = path.split("?")[0].split("/").filter(Boolean);
  if (segments[0] !== locale) return undefined;
  if (segments[1] === "services" && segments[2]) return segments[2];
  if (segments.length === 2) return getLandingPage(segments[1])?.service;
  return undefined;
}

function planLine(plan: NonNullable<ReturnType<typeof getServicePricing>>["plans"][number], unit?: "month") {
  const band = `${plan.mellonUpTo && !plan.mellon.includes("–") ? "up to " : ""}${plan.mellon}${unit ? " per month" : ""}`;
  return `- ${plan.name}: ${band}. ${plan.blurb} Typical timeline: ${plan.timeline}.`;
}

export function pricingContext(locale: string, path: string): string {
  const names = new Map(getServices(locale).map((s) => [s.slug, s.name]));
  const slug = serviceSlugFromPath(path, locale);

  if (slug) {
    const pricing = getServicePricing(locale, slug);
    if (pricing) {
      const lines = [`Published pricing for ${names.get(slug) ?? slug} (currency ${pricing.currency}):`];
      if (pricing.intro) lines.push(pricing.intro);
      lines.push(...pricing.plans.map((p) => planLine(p, pricing.unit)));
      if (pricing.showEngagements) {
        for (const e of getEngagements(locale)) {
          const unit = e.unit === "hour" ? "per hour" : "per month";
          lines.push(
            e.mellon
              ? `- ${e.name} (${e.blurb}): ${e.from ? "from " : ""}${e.mellon} ${unit}.`
              : `- ${e.name} (${e.blurb}): quoted after a short call.`,
          );
        }
      }
      return lines.join("\n");
    }
  }

  const overview: string[] = [];
  let currency = "";
  for (const [serviceSlug, name] of names) {
    const pricing = getServicePricing(locale, serviceSlug);
    if (!pricing) continue;
    currency = pricing.currency;
    const plans = pricing.plans.map((p) => `${p.name} ${p.mellonUpTo && !p.mellon.includes("–") ? "up to " : ""}${p.mellon}`);
    overview.push(`- ${name}: ${plans.join("; ")}${pricing.unit ? " (per month)" : ""}`);
  }
  return overview.length ? `Published pricing by service (currency ${currency}):\n${overview.join("\n")}` : "";
}
