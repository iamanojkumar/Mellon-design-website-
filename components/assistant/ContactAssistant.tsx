"use client";

import { useEffect, useRef, useState } from "react";
import { ContactForm, type ContactFormLabels } from "@/components/contact-form/ContactForm";
import { FadeIn } from "@/components/motion/HeroSequence";
import type { ChatCopy } from "./ChatWidget";
import { AssistantNote } from "./AssistantNote";
import { Turnstile } from "@/components/turnstile/Turnstile";
import { useAssistantChat } from "./useAssistantChat";
import styles from "./ContactAssistant.module.css";

type FormCopy = {
  successMessage: string;
  submitLabel: string;
  labels: ContactFormLabels;
};

/**
 * The contact page's way in: the same quick-chat conversation as the floating
 * button (useAssistantChat, /api/assistant), embedded in the page. The assistant
 * is the default; once it has the need, a name and an email it shows the contact
 * form already filled in for the visitor to check and send. "Prefer to fill in
 * the form yourself?" swaps the chat for the plain form at any point.
 *
 * If the assistant cannot answer at all (no API key, provider down) the page
 * opens on the form instead, so the contact page is never a dead end.
 */
export function ContactAssistant({
  locale,
  copy,
  form,
  aiPolicyHref,
  directEmail,
  heading,
  subheading,
}: {
  locale: string;
  copy: ChatCopy;
  form: FormCopy;
  /** Null until the AI policy page is published for this locale. */
  aiPolicyHref: string | null;
  /** "Or write to us directly at team@…", kept in the footer as the non-chat route. */
  directEmail?: { label: string; address: string };
  /** The page's heading and intro (the contact block's headline and subhead). They sit above both the chat and the form, so they have to make sense for either. */
  heading: string;
  subheading: string;
}) {
  const {
    messages,
    welcome,
    suggestions,
    draft,
    setDraft,
    loading,
    failed,
    welcomeFailed,
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
    turnstile,
  } = useAssistantChat({
    locale,
    fallbackWelcome: copy.fallbackWelcome,
    fallbackSuggestions: copy.fallbackSuggestions,
    active: true,
  });
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Whether the conversation has outgrown its box. Only then does the log take
  // over the wheel (data-lenis-prevent); until then the page must keep scrolling
  // normally over it, or a short chat would trap the pointer with nothing to scroll.
  const [scrollable, setScrollable] = useState(false);
  // The sticky header's real height, so the card can be exactly the screen
  // below it whatever the header measures at this width. null until measured
  // (the CSS falls back to a close default for the first paint).
  const [headerHeight, setHeaderHeight] = useState<number | null>(null);

  // No assistant to talk to: open on the form.
  useEffect(() => {
    if (welcomeFailed) setManual(true);
  }, [welcomeFailed, setManual]);

  // Follow the conversation inside the log (not the page).
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages, loading, suggestions, failed, welcome]);

  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return;
    const measure = () => setHeaderHeight(Math.round(header.getBoundingClientRect().height));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const log = logRef.current;
    if (!log) {
      setScrollable(false);
      return;
    }
    const measure = () => setScrollable(log.scrollHeight > log.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(log);
    return () => observer.disconnect();
  }, [messages, loading, suggestions, failed, welcome, formVisible]);

  // Hand the keyboard back to the composer after each reply, but not on first
  // load: grabbing focus there would scroll the page past the headline.
  useEffect(() => {
    if (messages.length > 0 && !loading && !formVisible) inputRef.current?.focus();
  }, [messages.length, loading, formVisible]);

  return (
    <FadeIn whenVisible>
      <section
        className={styles.card}
        data-view={formVisible ? "form" : "chat"}
        aria-labelledby="contact-heading"
        style={headerHeight ? ({ "--header-h": `${headerHeight}px` } as React.CSSProperties) : undefined}
      >
        <header className={styles.head}>
          <div>
            <h1 id="contact-heading" className={styles.title}>
              {heading}
            </h1>
            <p className={styles.subtitle}>{subheading}</p>
          </div>
          {/* The other way in, up where the eye lands rather than in the footer.
              A button, not a link, and a different colour from Send so it reads
              as an equal choice without competing with the assistant. Hidden once
              the chat has produced the filled-in form (that form is the next step). */}
          {stage !== "done" && (
            <button type="button" className={styles.switch} onClick={() => setManual((v) => !v)}>
              {manual ? (
                <svg width="18" height="18" viewBox="0 0 26 26" fill="none" aria-hidden="true">
                  <path
                    d="M5 6.5A3.5 3.5 0 018.5 3h9A3.5 3.5 0 0121 6.5v6a3.5 3.5 0 01-3.5 3.5H12l-4.4 3.6a.5.5 0 01-.8-.4V16A3.5 3.5 0 015 12.5v-6z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path
                    d="M3 4.5h12M3 9h12M3 13.5h7"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              )}
              <span>{manual ? copy.backToChat : copy.contactUseForm}</span>
            </button>
          )}
        </header>

        {formVisible ? (
          <div className={styles.formArea}>
            {stage === "done" && <p className={styles.editNote}>{copy.editNote}</p>}
            <ContactForm
              key={formKey}
              successMessage={form.successMessage}
              submitLabel={form.submitLabel}
              labels={form.labels}
              privacyHref={`/${locale}/privacy`}
              locale={locale}
              defaults={{ ...fields, message: summary }}
              wide
            />
          </div>
        ) : (
          <>
            <div
              className={styles.log}
              ref={logRef}
              role="log"
              aria-live="polite"
              data-lenis-prevent={scrollable ? "" : undefined}
            >
              {welcome && <p className={`${styles.bubble} ${styles.bot}`}>{welcome}</p>}
              {messages.map((m, i) => (
                <p key={i} className={`${styles.bubble} ${m.role === "user" ? styles.me : styles.bot}`}>
                  {m.content}
                </p>
              ))}
              {loading && (
                <p className={`${styles.bubble} ${styles.bot} ${styles.thinking}`}>{copy.thinking}</p>
              )}

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
            </div>

            <Turnstile {...turnstile} />
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
          </>
        )}

        <div className={styles.footer}>
          <div className={styles.footerText}>
            <AssistantNote
              locale={locale}
              copy={copy}
              aiPolicyHref={aiPolicyHref}
              className={styles.note}
            />
            {directEmail && (
              <p className={styles.note}>
                {directEmail.label}{" "}
                <a href={`mailto:${directEmail.address}`}>{directEmail.address}</a>
              </p>
            )}
          </div>
        </div>
      </section>
    </FadeIn>
  );
}
