"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ContactForm, type ContactFormLabels } from "@/components/contact-form/ContactForm";
import { FadeIn } from "@/components/motion/HeroSequence";
import { usePageReady } from "@/lib/page-transition";
import { AssistantNote } from "./AssistantNote";
import { Turnstile } from "@/components/turnstile/Turnstile";
import { useAssistantChat } from "./useAssistantChat";
import styles from "./ChatWidget.module.css";

export type ChatCopy = {
  open: string;
  close: string;
  title: string;
  subtitle: string;
  placeholder: string;
  detailsPlaceholder: string;
  send: string;
  thinking: string;
  error: string;
  retry: string;
  useForm: string;
  fallbackWelcome: string;
  fallbackSuggestions: string[];
  editNote: string;
  backToChat: string;
  /** Reassurance line; {privacy} and {ai} become links. */
  note: string;
  /** Same line for markets where the AI policy page is not published. */
  noteNoAi: string;
  privacyLink: string;
  aiLink: string;
  /** The same chat embedded on the contact page (ContactAssistant). */
  contactUseForm: string;
};

type FormCopy = {
  successMessage: string;
  submitLabel: string;
  labels: ContactFormLabels;
};

/**
 * Floating quick-chat. Opens with conversation starters written for the page
 * the visitor is on, asks a question or two to understand what they need, asks
 * for their name and email, and then shows the contact form already filled in
 * from the conversation, ready to send. The AI call lives in /api/assistant. If
 * a call fails mid-conversation the visitor can retry or switch to the plain
 * form; the chat never just stops.
 */
export function ChatWidget({
  locale,
  copy,
  form,
  aiPolicyHref,
}: {
  locale: string;
  copy: ChatCopy;
  form: FormCopy;
  /** Null until the AI policy page is published for this locale. */
  aiPolicyHref: string | null;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const {
    messages,
    welcome,
    suggestions,
    draft,
    setDraft,
    loading,
    failed,
    stage,
    summary,
    fields,
    manual,
    setManual,
    formVisible,
    formKey,
    send,
    submitDraft,
    retry,
    reset,
    turnstile,
  } = useAssistantChat({
    locale,
    fallbackWelcome: copy.fallbackWelcome,
    fallbackSuggestions: copy.fallbackSuggestions,
    active: open,
  });
  // The intro (sparkle spin, then one sparkle -> message -> sparkle morph) must
  // wait for the preloader / page transition, or it plays behind the curtain.
  // `armed` flips once, the first time the page is ready, so it never replays.
  const pageReady = usePageReady();
  const [armed, setArmed] = useState(false);
  const [hint, setHint] = useState(true);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Moving to another page ends the conversation: collapse the panel and start
  // fresh, so the next open gets starters written for the new page.
  const lastPath = useRef(pathname);
  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    reset();
    setOpen(false);
  }, [pathname, reset]);

  useEffect(() => {
    if (pageReady) setArmed(true);
  }, [pageReady]);

  useEffect(() => {
    if (!armed) return;
    const timer = window.setTimeout(() => setHint(false), 7600);
    return () => window.clearTimeout(timer);
  }, [armed]);

  useEffect(() => {
    if (open && !loading && !formVisible) inputRef.current?.focus();
  }, [open, loading, formVisible]);

  useEffect(() => {
    // Bring the filled-in form into view from its top; otherwise follow the chat.
    if (formVisible && !loading && formRef.current) {
      formRef.current.scrollIntoView({ block: "start" });
      return;
    }
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, loading, suggestions, formVisible, failed]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // The contact page is already the form.
  if (/\/contact\/?$/.test(pathname)) return null;

  return (
    <>
      {/* Always mounted so it can shrink back to the button; hidden from everything (including
          tab order) while closed. data-lenis-prevent: the log scrolls natively, not the page. */}
      <div
        className={styles.panel}
        role="dialog"
        aria-label={copy.title}
        data-open={open}
        data-lenis-prevent
      >
        <header className={styles.head}>
          <div>
            <p className={styles.title}>{copy.title}</p>
            <p className={styles.subtitle}>{copy.subtitle}</p>
          </div>
          <button
            type="button"
            className={styles.close}
            aria-label={copy.close}
            onClick={() => {
              setOpen(false);
              buttonRef.current?.focus();
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3.5 3.5l9 9m0-9l-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className={styles.log} ref={logRef} role="log" aria-live="polite">
          {welcome && <p className={`${styles.bubble} ${styles.bot}`}>{welcome}</p>}
          {messages.map((m, i) => (
            <p key={i} className={`${styles.bubble} ${m.role === "user" ? styles.me : styles.bot}`}>
              {m.content}
            </p>
          ))}
          {loading && <p className={`${styles.bubble} ${styles.bot} ${styles.thinking}`}>{copy.thinking}</p>}

          {failed && !loading && (
            <div className={styles.errorBox}>
              <p className={styles.error}>{copy.error}</p>
              <button type="button" className={styles.chip} onClick={retry}>
                {copy.retry}
              </button>
            </div>
          )}

          {!loading && suggestions.length > 0 && (
            <ul className={styles.chips}>
              {suggestions.map((s) => (
                <li key={s}>
                  <button type="button" className={styles.chip} onClick={() => send(s)}>
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {formVisible && !loading && (
            <div className={styles.formWrap} ref={formRef}>
              {stage === "done" && <p className={styles.editNote}>{copy.editNote}</p>}
              <ContactForm
                key={formKey}
                successMessage={form.successMessage}
                submitLabel={form.submitLabel}
                labels={form.labels}
                privacyHref={`/${locale}/privacy`}
                locale={locale}
                defaults={{ ...fields, message: summary }}
                plain
              />
            </div>
          )}
        </div>

        {open && !formVisible && <Turnstile {...turnstile} />}

        {!formVisible && (
          <form className={styles.composer} onSubmit={submitDraft}>
            <input
              ref={inputRef}
              type="text"
              value={draft}
              maxLength={500}
              placeholder={stage === "details" ? copy.detailsPlaceholder : copy.placeholder}
              aria-label={stage === "details" ? copy.detailsPlaceholder : copy.placeholder}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button type="submit" disabled={loading || !draft.trim()}>
              {copy.send}
            </button>
          </form>
        )}

        <div className={styles.footer}>
          <AssistantNote locale={locale} copy={copy} aiPolicyHref={aiPolicyHref} />
          {stage !== "done" && (
            <button type="button" className={styles.linkButton} onClick={() => setManual((v) => !v)}>
              {manual ? copy.backToChat : copy.useForm}
            </button>
          )}
        </div>
      </div>

      {/* The fixed wrapper carries the fade; a fixed child inside a transformed
          parent would be positioned against the parent instead of the viewport. */}
      <FadeIn as="span" delay={0.6} className={styles.dock}>
        <button
          ref={buttonRef}
          type="button"
          className={styles.launcher}
          data-open={open}
          data-armed={armed}
          data-hint={hint}
          aria-expanded={open}
          aria-label={open ? copy.close : copy.open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={`${styles.glyph} ${styles.spark}`}>
            <svg width="36" height="36" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path
                d="M9.28712 13.3983C9.3679 13.3312 9.42268 13.238 9.44196 13.1348C9.59714 12.2121 10.0361 11.3607 10.6977 10.6991C11.3593 10.0375 12.2106 9.5986 13.1333 9.44343C13.2365 9.42415 13.3298 9.36937 13.3969 9.28858C13.464 9.2078 13.5007 9.10609 13.5007 9.00108C13.5007 8.89606 13.464 8.79436 13.3969 8.71357C13.3298 8.63279 13.2365 8.57801 13.1333 8.55873C12.2106 8.40355 11.3593 7.96463 10.6977 7.30303C10.0361 6.64143 9.59714 5.79006 9.44196 4.86738C9.42268 4.76415 9.3679 4.67091 9.28712 4.60382C9.20633 4.53673 9.10463 4.5 8.99961 4.5C8.8946 4.5 8.79289 4.53673 8.71211 4.60382C8.63132 4.67091 8.57654 4.76415 8.55726 4.86738C8.40209 5.79006 7.96316 6.64143 7.30156 7.30303C6.63997 7.96463 5.7886 8.40355 4.86591 8.55873C4.76268 8.57801 4.66945 8.63279 4.60236 8.71357C4.53526 8.79436 4.49854 8.89606 4.49854 9.00108C4.49854 9.10609 4.53526 9.2078 4.60236 9.28858C4.66945 9.36937 4.76268 9.42415 4.86591 9.44343C5.7886 9.5986 6.63997 10.0375 7.30156 10.6991C7.96316 11.3607 8.40209 12.2121 8.55726 13.1348C8.57654 13.238 8.63132 13.3312 8.71211 13.3983C8.79289 13.4654 8.8946 13.5022 8.99961 13.5022C9.10463 13.5022 9.20633 13.4654 9.28712 13.3983Z"
                fill="#fff"
                stroke="#fff"
                strokeWidth="0.45"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className={`${styles.glyph} ${styles.chat}`}>
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
              <path
                d="M5 6.5A3.5 3.5 0 018.5 3h9A3.5 3.5 0 0121 6.5v6a3.5 3.5 0 01-3.5 3.5H12l-4.4 3.6a.5.5 0 01-.8-.4V16A3.5 3.5 0 015 12.5v-6z"
                fill="#fff"
                stroke="#fff"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className={`${styles.glyph} ${styles.cross}`}>
            <svg width="22" height="22" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3.5 3.5l9 9m0-9l-9 9" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </span>
        </button>
      </FadeIn>
    </>
  );
}
