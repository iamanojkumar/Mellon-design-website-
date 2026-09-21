import "server-only";
import type { ContactSubmission } from "@/lib/submissions";

/**
 * Tells the team a contact-form enquiry arrived by POSTing it to a webhook
 * (a Zoho Flow "Webhook" trigger, which then sends the email / chat message).
 * Best-effort: the enquiry is already stored in Supabase before this runs, so
 * a failure here must never lose the lead or fail the visitor's submission.
 *
 * Env (server-only): CONTACT_WEBHOOK_URL — the full webhook URL, treated as a secret.
 */
export async function notifyNewSubmission(submission: ContactSubmission): Promise<void> {
  const url = process.env.CONTACT_WEBHOOK_URL;
  if (!url) {
    console.warn("[contact-form] notification skipped: CONTACT_WEBHOOK_URL is not set");
    return;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: submission.name,
      email: submission.email,
      company: submission.company || "",
      budget: submission.budget || "",
      locale: submission.locale,
      message: submission.message,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`Notification webhook failed: ${response.status}`);
  }
}
