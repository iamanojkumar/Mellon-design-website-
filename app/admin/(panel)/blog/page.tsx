import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/admin-auth";
import { listPosts } from "@/lib/posts";
import { defaultLocale } from "@/lib/locale";
import { BlogApp } from "@/components/admin/BlogApp";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminBlogPage() {
  if (!(await isAdminAuthed())) redirect("/admin/login");

  return <BlogApp initialLocale={defaultLocale} initialPosts={await listPosts(defaultLocale)} />;
}
