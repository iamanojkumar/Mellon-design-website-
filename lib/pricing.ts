import pricingData from "@/content/pricing.json";

/**
 * Service pricing (content/pricing.json). Prices are per locale in that market's
 * currency; a locale with no entry shows no pricing section (de-DE, fr-FR, es-ES,
 * nl-NL until real figures and translated plan copy exist). Deliberately no
 * fallback chain: a German page must not inherit USD prices with English plan copy.
 */

export type FeatureValue = "yes" | "extra" | "no" | (string & {});

export type PricingFeature = {
  label: string;
  mellon: FeatureValue;
  market: FeatureValue;
};

export type PricingPlan = {
  id: string;
  name: string;
  blurb: string;
  timeline: string;
  features: PricingFeature[];
  mellon: string;
  /** True when only the top of Mellon's band is shown (the minimum is kept internal). */
  mellonUpTo: boolean;
  market: string;
};

export type ServicePricing = {
  currency: string;
  intro?: string;
  /** "month" when the plans are monthly fees rather than one-off project prices. */
  unit?: "month";
  /** False for services whose plans are already monthly (no hourly and retainer cards). */
  showEngagements: boolean;
  plans: PricingPlan[];
};

type RawPlan = Omit<PricingPlan, "mellon" | "mellonUpTo" | "market"> & {
  prices: Record<string, { mellon: number[]; market: number[] }>;
};

const currencies = pricingData.currencies as Record<string, string>;
const services = pricingData.services as Record<string, { intro?: string; unit?: "month"; engagements?: boolean; plans: RawPlan[] }>;

function formatRange(locale: string, currency: string, [low, high]: number[]): string {
  const money = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  return high === undefined ? money.format(low) : `${money.format(low)} – ${money.format(high)}`;
}

export function getServicePricing(locale: string, slug: string): ServicePricing | null {
  const currency = currencies[locale];
  const plans = services[slug]?.plans;
  if (!currency || !plans) return null;
  const resolved: PricingPlan[] = [];
  for (const { prices, ...plan } of plans) {
    const price = prices[locale];
    if (!price) return null;
    resolved.push({
      ...plan,
      mellon: formatRange(locale, currency, price.mellon),
      mellonUpTo: price.mellon.length === 1,
      market: formatRange(locale, currency, price.market),
    });
  }
  const { intro, unit, engagements: showEngagements } = services[slug];
  return { currency, intro, unit, showEngagements: showEngagements !== false, plans: resolved };
}

export type Engagement = {
  id: string;
  name: string;
  blurb: string;
  unit: "hour" | "month";
  includes: string[];
  /** "From" pricing (a base fee) rather than a flat rate. */
  from: boolean;
  /** Absent when the price is not published (the card says it is quoted on request). */
  mellon?: string;
  market?: string;
};

type RawEngagement = Omit<Engagement, "mellon" | "market"> & {
  prices?: Record<string, { mellon: number[]; market: number[] }>;
};

const engagements = pricingData.engagements as RawEngagement[];

/** Hourly and retainer cards, shared by every service with pricing. */
export function getEngagements(locale: string): Engagement[] {
  const currency = currencies[locale];
  if (!currency) return [];
  const resolved: Engagement[] = [];
  for (const { prices, ...engagement } of engagements) {
    if (!prices) {
      resolved.push(engagement);
      continue;
    }
    const price = prices[locale];
    if (!price) return [];
    resolved.push({
      ...engagement,
      mellon: formatRange(locale, currency, price.mellon),
      market: formatRange(locale, currency, price.market),
    });
  }
  return resolved;
}
