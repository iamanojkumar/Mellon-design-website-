"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { submitContactForm } from "@/components/contact-form/actions";
import { initialContactFormState } from "@/components/contact-form/schema";
import styles from "./ContactForm.module.css";

export type ContactFormLabels = {
  name: string;
  email: string;
  company: string;
  budget: string;
  budgetPlaceholder: string;
  message: string;
  sending: string;
  genericError: string;
  privacyNote: string;
  privacyLink: string;
};

type ContactFormProps = {
  successMessage: string;
  submitLabel: string;
  labels: ContactFormLabels;
  privacyHref: string;
  locale: string;
};

function SubmitButton({ label, sending }: { label: string; sending: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.submit} disabled={pending}>
      {pending ? sending : label}
    </button>
  );
}

export function ContactForm({ successMessage, submitLabel, labels, privacyHref, locale }: ContactFormProps) {
  const [state, formAction] = useActionState(
    submitContactForm,
    initialContactFormState,
  );

  if (state.status === "success") {
    return (
      <div className={styles.success} role="status">
        {successMessage}
      </div>
    );
  }

  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className={styles.form} noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      />
      <div className={styles.row}>
        <label className={styles.field}>
          <span>{labels.name}</span>
          <input type="text" name="name" autoComplete="name" required />
          {errors.name && <em className={styles.error}>{errors.name}</em>}
        </label>
        <label className={styles.field}>
          <span>{labels.email}</span>
          <input type="email" name="email" autoComplete="email" required />
          {errors.email && <em className={styles.error}>{errors.email}</em>}
        </label>
      </div>

      <div className={styles.row}>
        <label className={styles.field}>
          <span>{labels.company}</span>
          <input type="text" name="company" autoComplete="organization" />
        </label>
        <label className={styles.field}>
          <span>{labels.budget}</span>
          <input type="text" name="budget" placeholder={labels.budgetPlaceholder} />
        </label>
      </div>

      <label className={styles.field}>
        <span>{labels.message}</span>
        <textarea name="message" rows={6} required />
        {errors.message && <em className={styles.error}>{errors.message}</em>}
      </label>

      {state.status === "error" && !Object.keys(errors).length && (
        <p className={styles.error}>{labels.genericError}</p>
      )}

      <p className={styles.privacy}>
        {labels.privacyNote} <Link href={privacyHref}>{labels.privacyLink}</Link>.
      </p>

      <SubmitButton label={submitLabel} sending={labels.sending} />
    </form>
  );
}
