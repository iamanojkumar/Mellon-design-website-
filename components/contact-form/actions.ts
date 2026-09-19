"use server";

import {
  contactFormSchema,
  type ContactFormState,
} from "@/components/contact-form/schema";

export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const raw = {
    name: formData.get("name")?.toString() ?? "",
    email: formData.get("email")?.toString() ?? "",
    company: formData.get("company")?.toString() ?? "",
    budget: formData.get("budget")?.toString() ?? "",
    message: formData.get("message")?.toString() ?? "",
  };

  const result = contactFormSchema.safeParse(raw);

  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return { status: "error", fieldErrors };
  }

  // Delivery integration (email/CRM) is intentionally not wired yet —
  // this is where it plugs in once a provider is chosen. For now the
  // validated submission is logged so nothing is silently dropped.
  console.info("[contact-form] new submission", {
    name: result.data.name,
    email: result.data.email,
    company: result.data.company,
    budget: result.data.budget,
  });

  return { status: "success" };
}
