import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-auth";
import { AdminNav } from "@/components/admin/AdminNav";

/** Everything behind the login: left navigation plus the active tool. */
export default async function PanelLayout({ children }: { children: ReactNode }) {
  if (!(await isAdminAuthed())) redirect("/admin/login");

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <AdminNav />
      <div style={{ flex: 1, minWidth: 0, height: "100vh", overflow: "hidden" }}>{children}</div>
    </div>
  );
}
