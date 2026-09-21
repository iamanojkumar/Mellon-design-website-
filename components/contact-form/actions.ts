"use server";

import { getSiteContent } from "@/lib/content";
import { notifyNewSubmission } from "@/lib/notify";
import { saveContactSubmission } from "@/lib/submissions";
import { defaultLocale, isEnabledLocale } from "@/lib/locale";
import {
  createContactFormSchema,
  type ContactFormState,
} from "@/components/contact-form/schema";

export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const submittedLocale = formData.get("locale")?.toString() ?? "";
  const locale = isEnabledLocale(submittedLocale) ? submittedLocale : defaultLocale;
  const contactFormSchema = createContactFormSchema(
    getSiteContent(locale).forms.contact.validation,
  );

  // Honeypot: real visitors never see or fill this field; bots usually do.
  // Pretend success so they get no signal, and store nothing.
  if (formData.get("website")?.toString()) return { status: "success" };

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

  try {
    await saveContactSubmission({ locale, ...result.data });
  } catch (error) {
    // A failed delivery must never look like a success to the visitor.
    console.error("[contact-form] could not save submission", error);
    return { status: "error", formError: "delivery_failed" };
  }

  // The enquiry is safely stored; the email is only a heads-up to the team.
  try {
    await notifyNewSubmission({ locale, ...result.data });
  } catch (error) {
    console.error("[contact-form] notification email failed", error);
  }

  return { status: "success" };
}
