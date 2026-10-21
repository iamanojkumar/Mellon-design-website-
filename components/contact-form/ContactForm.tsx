"use client";

import { createContext, useActionState, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { submitContactForm } from "@/components/contact-form/actions";
import { initialContactFormState } from "@/components/contact-form/schema";
import { FadeIn } from "@/components/motion/HeroSequence";
import { SwiftUpText } from "@/components/motion/SwiftUpText";
import { Turnstile } from "@/components/turnstile/Turnstile";
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
  /** Pre-fills the fields (the quick-chat hand-off); the visitor can edit them. */
  defaults?: Partial<Record<"name" | "email" | "company" | "budget" | "message", string>>;
  /** Skips the scroll-in animations. For forms inside a scrolling panel (the quick chat). */
  plain?: boolean;
  /**
   * For a form given the full page width (the contact page): the four short
   * fields wrap into as many columns as fit instead of each stretching across,
   * and the message keeps a readable line length.
   */
  wide?: boolean;
};

const PlainContext = createContext(false);

/** FadeIn, unless the form is `plain`. */
function Reveal({
  delay,
  as,
  className,
  children,
}: {
  delay: number;
  as?: "div" | "span";
  className?: string;
  children: ReactNode;
}) {
  if (useContext(PlainContext)) {
    const Tag = as ?? "div";
    return <Tag className={className}>{children}</Tag>;
  }
  return (
    <FadeIn whenVisible as={as} delay={delay} className={className}>
      {children}
    </FadeIn>
  );
}

/**
 * One labelled control. The label text slides up and the control fades in when
 * the form scrolls into view; `delay` staggers the fields top to bottom.
 */
function Field({
  label,
  delay,
  error,
  className,
  required,
  children,
}: {
  label: string;
  delay: number;
  error?: string;
  className?: string;
  /** Adds the required marker (an asterisk) after the label. Optional fields say "(optional)" in their label instead. */
  required?: boolean;
  children: ReactNode;
}) {
  const plain = useContext(PlainContext);
  return (
    <label className={[styles.field, required && styles.required, className].filter(Boolean).join(" ")}>
      <span>{plain ? label : <SwiftUpText text={label} whenVisible delay={delay} />}</span>
      <Reveal delay={delay + 0.15}>{children}</Reveal>
      {error && <em className={styles.error}>{error}</em>}
    </label>
  );
}

function SubmitButton({ label, sending, waiting }: { label: string; sending: string; waiting: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={styles.submit} disabled={pending || waiting}>
      {pending ? sending : label}
    </button>
  );
}

export function ContactForm({ successMessage, submitLabel, labels, privacyHref, locale, defaults, plain = false, wide = false }: ContactFormProps) {
  const [state, formAction] = useActionState(
    submitContactForm,
    initialContactFormState,
  );
  // Turnstile: the send button waits for a token (a second or less, usually
  // invisible). If the check cannot run at all it stops waiting, and the server
  // rejects the submission with the generic error rather than leaving the form dead.
  const [token, setToken] = useState<string | null>(null);
  const [checkFailed, setCheckFailed] = useState(false);
  useEffect(() => {
    // A submission spends the token (the widget resets on `state` and issues a new one).
    if (state.status === "error") setToken(null);
  }, [state]);

  if (state.status === "success") {
    return (
      <div className={styles.success} role="status">
        {successMessage}
      </div>
    );
  }

  const errors = state.fieldErrors ?? {};

  return (
    <PlainContext.Provider value={plain}>
      <form
        action={formAction}
        className={[styles.form, plain && styles.plain, wide && styles.wide].filter(Boolean).join(" ")}
        noValidate
      >
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
          <Field label={labels.name} delay={0} error={errors.name} required>
            <input type="text" name="name" autoComplete="name" defaultValue={defaults?.name} required />
          </Field>
          <Field label={labels.email} delay={0.08} error={errors.email} required>
            <input type="email" name="email" autoComplete="email" defaultValue={defaults?.email} required />
          </Field>
        </div>

        <div className={styles.row}>
          <Field label={labels.company} delay={0.2}>
            <input type="text" name="company" autoComplete="organization" defaultValue={defaults?.company} />
          </Field>
          <Field label={labels.budget} delay={0.28}>
            <input type="text" name="budget" placeholder={labels.budgetPlaceholder} defaultValue={defaults?.budget} />
          </Field>
        </div>

        <Field label={labels.message} delay={0.4} error={errors.message} className={styles.message} required>
          <textarea name="message" rows={6} defaultValue={defaults?.message} required />
        </Field>

        <Turnstile
          action="contact"
          resetKey={state}
          onToken={(value) => {
            setToken(value);
            if (value) setCheckFailed(false);
          }}
          onError={() => setCheckFailed(true)}
        />

        {state.status === "error" && !Object.keys(errors).length && (
          <p className={styles.error}>{labels.genericError}</p>
        )}

        <Reveal delay={0.55}>
          <p className={styles.privacy}>
            {labels.privacyNote} <Link href={privacyHref}>{labels.privacyLink}</Link>.
          </p>
        </Reveal>

        <Reveal as="span" delay={0.65} className={styles.submitWrap}>
          <SubmitButton label={submitLabel} sending={labels.sending} waiting={!token && !checkFailed} />
        </Reveal>
      </form>
    </PlainContext.Provider>
  );
}
