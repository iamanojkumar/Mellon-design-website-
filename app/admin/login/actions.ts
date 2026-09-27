"use server";

import { redirect } from "next/navigation";
import { checkPassword, setAdminSession } from "@/lib/admin-auth";

export type LoginState = { status: "idle" | "error" };

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const password = formData.get("password")?.toString() ?? "";

  if (!checkPassword(password)) {
    return { status: "error" };
  }

  await setAdminSession();
  redirect("/admin");
}
