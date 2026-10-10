import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-auth";
import { listLandingPages } from "@/lib/landing-db";
import { getServices } from "@/lib/content";
import { defaultLocale, enabledLocaleCodes } from "@/lib/locale";
import { LandingApp } from "@/components/admin/LandingApp";

export const metadata = { robots: { index: false, follow: false } };

/** Landing pages created in the admin. The pages defined in code stay in /admin/landing-pages. */
export default async function LandingEditorPage() {
  if (!(await isAdminAuthed())) redirect("/admin/login");

  const servicesByLocale = Object.fromEntries(
    enabledLocaleCodes.map((code) => [
      code,
      getServices(code).map((service) => ({ slug: service.slug, name: service.name })),
    ]),
  );

  return (
    <LandingApp
      initialRows={await listLandingPages()}
      servicesByLocale={servicesByLocale}
      defaultLocale={defaultLocale}
    />
  );
}
