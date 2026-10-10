import "server-only";

import type { ServiceLandingCopy } from "@/components/landing/ServiceLanding";
import { bodyText, coerceLandingCopy, type OtherPage } from "@/lib/landing-content";
import { copy as figmaIndia } from "@/app/[locale]/(landing-pages)/figma-design-system-agency-india/copy";
import { copy as saasUi } from "@/app/[locale]/(landing-pages)/saas-ui-design-agency-india/copy";
import { copy as saasDashboard } from "@/app/[locale]/(landing-pages)/saas-dashboard-design-agency-india/copy";
import { copy as webBangalore } from "@/app/[locale]/(landing-pages)/web-design-company-bangalore/copy";
import { copy as brandingBangalore } from "@/app/[locale]/(landing-pages)/branding-agency-bangalore/copy";
import { copy as uiuxBangalore } from "@/app/[locale]/(landing-pages)/ui-ux-design-company-bangalore/copy";
import { copy as figmaFrance } from "@/app/[locale]/(landing-pages)/agence-design-system-figma-inde/copy";
import { copy as brandingDubai } from "@/app/[locale]/(landing-pages)/branding-agency-dubai/copy";
import { copy as webToronto } from "@/app/[locale]/(landing-pages)/web-design-company-toronto/copy";
import { copy as brandingSingapore } from "@/app/[locale]/(landing-pages)/branding-agency-singapore/copy";
import { copy as brandingAustralia } from "@/app/[locale]/(landing-pages)/branding-agency-australia/copy";

/**
 * Read-only view of the landing pages that are defined in code, so the admin
 * editor and its assistant can see what already exists: to keep metadata
 * unique, avoid near-duplicate copy and pick a distinct search intent. This
 * file only imports the existing pages' copy; it changes none of them. When a
 * code-defined page is added to lib/landing-pages.ts, add it here too.
 */
const CODE_COPY: Record<string, Record<string, ServiceLandingCopy>> = {
  "figma-design-system-agency-india": figmaIndia,
  "saas-ui-design-agency-india": saasUi,
  "saas-dashboard-design-agency-india": saasDashboard,
  "web-design-company-bangalore": webBangalore,
  "branding-agency-bangalore": brandingBangalore,
  "ui-ux-design-company-bangalore": uiuxBangalore,
  "agence-design-system-figma-inde": figmaFrance,
  "branding-agency-dubai": brandingDubai,
  "web-design-company-toronto": webToronto,
  "branding-agency-singapore": brandingSingapore,
  "branding-agency-australia": brandingAustralia,
};

export function getCodeLandingPages(): OtherPage[] {
  return Object.entries(CODE_COPY).flatMap(([slug, byLocale]) =>
    Object.values(byLocale).map((raw) => {
      const copy = coerceLandingCopy(raw);
      return {
        slug,
        metaTitle: copy.metaTitle,
        metaDescription: copy.metaDescription,
        headline: copy.headline,
        body: bodyText(copy),
      };
    }),
  );
}

/** Slugs of every code-defined landing page, for collision checks. */
export const CODE_LANDING_SLUGS = Object.keys(CODE_COPY);
