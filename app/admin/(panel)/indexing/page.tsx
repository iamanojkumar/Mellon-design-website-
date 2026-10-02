import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-auth";
import { listUrlRules, type UrlRule } from "@/lib/url-rules-store";
import { IndexingApp } from "@/components/admin/IndexingApp";

export const metadata = { robots: { index: false, follow: false } };

export default async function IndexingPage() {
  if (!(await isAdminAuthed())) redirect("/admin/login");

  let rules: UrlRule[] = [];
  let loadError: string | null = null;
  try {
    rules = await listUrlRules();
  } catch (error) {
    console.error("[admin] load url rules failed", error);
    loadError = "Could not load the list. Has the url_rules migration been run in Supabase?";
  }

  return <IndexingApp initialRules={rules} initialError={loadError} />;
}
