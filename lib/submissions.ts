import "server-only";

export type ContactSubmission = {
  locale: string;
  name: string;
  email: string;
  company?: string;
  budget?: string;
  message: string;
};

/**
 * Stores a contact-form enquiry in Supabase (table: contact_submissions).
 * Server-only: uses the service-role key, which must never reach the browser.
 * Talks to PostgREST directly, so no client library is needed.
 * Throws on any failure so the caller can show an error instead of success.
 */
export async function saveContactSubmission(submission: ContactSubmission): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set");
  }

  const response = await fetch(`${url}/rest/v1/contact_submissions`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      locale: submission.locale,
      name: submission.name,
      email: submission.email,
      company: submission.company || null,
      budget: submission.budget || null,
      message: submission.message,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Supabase insert failed: ${response.status} ${await response.text()}`);
  }
}
