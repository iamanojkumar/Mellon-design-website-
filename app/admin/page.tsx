import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-auth";
import { listProjects } from "@/lib/projects";
import { listFolders } from "@/lib/folders";
import { getIndustries, getServices } from "@/lib/content";
import { defaultLocale } from "@/lib/locale";
import { AdminApp } from "@/components/admin/AdminApp";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminPage() {
  if (!(await isAdminAuthed())) redirect("/admin/login");

  const initialLocale = defaultLocale;
  const [projects, folders] = await Promise.all([
    listProjects(initialLocale),
    listFolders(initialLocale),
  ]);

  return (
    <AdminApp
      initialLocale={initialLocale}
      initialProjects={projects}
      initialFolders={folders}
      initialIndustries={getIndustries(initialLocale)}
      initialServices={getServices(initialLocale)}
    />
  );
}
