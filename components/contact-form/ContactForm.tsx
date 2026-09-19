"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitContactForm } from "@/components/contact-form/actions";
import { initialContactFormState } from "@/components/contact-form/schema";
import styles from "./ContactForm.module.css";

type ContactFormProps = {
  successMessage: string;
  submitLabel: string;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.submit} disabled={pending}>
      {pending ? "Sending…" : label}
    </button>
  );
}

export function ContactForm({ successMessage, submitLabel }: ContactFormProps) {
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
      <div className={styles.row}>
        <label className={styles.field}>
          <span>Name</span>
          <input type="text" name="name" autoComplete="name" required />
          {errors.name && <em className={styles.error}>{errors.name}</em>}
        </label>
        <label className={styles.field}>
          <span>Email</span>
          <input type="email" name="email" autoComplete="email" required />
          {errors.email && <em className={styles.error}>{errors.email}</em>}
        </label>
      </div>

      <div className={styles.row}>
        <label className={styles.field}>
          <span>Company (optional)</span>
          <input type="text" name="company" autoComplete="organization" />
        </label>
        <label className={styles.field}>
          <span>Budget range (optional)</span>
          <input type="text" name="budget" placeholder="e.g. $15k–$40k" />
        </label>
      </div>

      <label className={styles.field}>
        <span>What are you building?</span>
        <textarea name="message" rows={6} required />
        {errors.message && <em className={styles.error}>{errors.message}</em>}
      </label>

      {state.status === "error" && !Object.keys(errors).length && (
        <p className={styles.error}>Something went wrong. Please try again.</p>
      )}

      <SubmitButton label={submitLabel} />
    </form>
  );
}
