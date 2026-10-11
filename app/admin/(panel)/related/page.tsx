import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-auth";
import { defaultLocale } from "@/lib/locale";
import { loadRelatedAction } from "@/app/admin/related-actions";
import { RelatedWorkApp } from "@/components/admin/RelatedWorkApp";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminRelatedPage() {
  if (!(await isAdminAuthed())) redirect("/admin/login");

  const result = await loadRelatedAction(defaultLocale);
  return (
    <RelatedWorkApp
      initialLocale={defaultLocale}
      initialData={result.ok ? result.data : { projects: [], pages: [], overrides: [] }}
      initialError={result.ok ? null : result.error}
    />
  );
}
