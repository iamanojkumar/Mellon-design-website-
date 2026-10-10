import "server-only";

import { bodyText, type OtherPage } from "@/lib/landing-content";
import { getCodeLandingPages } from "@/lib/landing-code-pages";
import { listLandingPages } from "@/lib/landing-db";

/**
 * Every other landing page's identifying copy: the code-defined pages plus the
 * admin-created ones (except `excludeId`, the page being edited). The editor's
 * rule checks and the assistant's context both compare a page against this.
 */
export async function getOtherLandingPages(excludeId: string | null): Promise<OtherPage[]> {
  const rows = await listLandingPages();
  return [
    ...getCodeLandingPages(),
    ...rows
      .filter((row) => row.id !== excludeId)
      .map((row) => ({
        slug: row.slug,
        metaTitle: row.copy.metaTitle,
        metaDescription: row.copy.metaDescription,
        headline: row.copy.headline,
        body: bodyText(row.copy),
      })),
  ];
}
