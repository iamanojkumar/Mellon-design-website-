import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-auth";
import { LoginForm } from "./LoginForm";
import styles from "./login.module.css";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLoginPage() {
  if (await isAdminAuthed()) redirect("/admin");

  return (
    <main className={styles.page}>
      <LoginForm />
    </main>
  );
}
