"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { submitContactForm } from "@/components/contact-form/actions";
import { initialContactFormState } from "@/components/contact-form/schema";
import { FadeIn } from "@/components/motion/HeroSequence";
import { SwiftUpText } from "@/components/motion/SwiftUpText";
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

/**
 * One labelled control. The label text slides up and the control fades in when
 * the form scrolls into view; `delay` staggers the fields top to bottom.
 */
function Field({
  label,
  delay,
  error,
  children,
}: {
  label: string;
  delay: number;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className={styles.field}>
      <span>
        <SwiftUpText text={label} whenVisible delay={delay} />
      </span>
      <FadeIn whenVisible delay={delay + 0.15}>
        {children}
      </FadeIn>
      {error && <em className={styles.error}>{error}</em>}
    </label>
  );
}

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
        <Field label={labels.name} delay={0} error={errors.name}>
          <input type="text" name="name" autoComplete="name" required />
        </Field>
        <Field label={labels.email} delay={0.08} error={errors.email}>
          <input type="email" name="email" autoComplete="email" required />
        </Field>
      </div>

      <div className={styles.row}>
        <Field label={labels.company} delay={0.2}>
          <input type="text" name="company" autoComplete="organization" />
        </Field>
        <Field label={labels.budget} delay={0.28}>
          <input type="text" name="budget" placeholder={labels.budgetPlaceholder} />
        </Field>
      </div>

      <Field label={labels.message} delay={0.4} error={errors.message}>
        <textarea name="message" rows={6} required />
      </Field>

      {state.status === "error" && !Object.keys(errors).length && (
        <p className={styles.error}>{labels.genericError}</p>
      )}

      <FadeIn whenVisible delay={0.55}>
        <p className={styles.privacy}>
          {labels.privacyNote} <Link href={privacyHref}>{labels.privacyLink}</Link>.
        </p>
      </FadeIn>

      <FadeIn as="span" whenVisible delay={0.65} className={styles.submitWrap}>
        <SubmitButton label={submitLabel} sending={labels.sending} />
      </FadeIn>
    </form>
  );
}
