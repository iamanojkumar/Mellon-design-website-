import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-auth";
import { landingPages, getLandingPageLocales } from "@/lib/landing-pages";
import { LandingPagesList } from "./LandingPagesList";

export const metadata = { robots: { index: false, follow: false } };

/** Every registered landing page, one row per locale version. */
export default async function LandingPagesPage() {
  if (!(await isAdminAuthed())) redirect("/admin/login");

  const rows = landingPages.flatMap((page) =>
    getLandingPageLocales(page).map((locale) => ({
      slug: page.slug,
      locale,
      indexable: page.indexable,
      path: `/${locale}/${page.slug}`,
    })),
  );

  return <LandingPagesList rows={rows} />;
}
