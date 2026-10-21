"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

/**
 * The quick-chat conversation, shared by the floating widget (ChatWidget) and
 * the contact page (ContactAssistant). It owns what the two surfaces must agree
 * on — the messages, the stage the model reports, the enquiry it drafts from the
 * conversation and the call to /api/assistant — and nothing about how it looks.
 *
 * The model's reply drives `stage`:
 *   discover  working out what they need (suggestion chips shown)
 *   details   need is clear; asking for name and email
 *   done      a summary and a valid name + email are in hand: show the filled form
 */

export type Message = { role: "user" | "assistant"; content: string };
export type Stage = "discover" | "details" | "done";
export type Fields = { name: string; email: string; company: string; budget: string };

/** `stage` and `fields` are null when the model answered in plain prose. */
type Reply = {
  reply: string;
  stage: Stage | null;
  suggestions: string[];
  summary: string;
  fields: Fields | null;
};

const EMPTY_FIELDS: Fields = { name: "", email: "", company: "", budget: "" };

export function useAssistantChat({
  locale,
  fallbackWelcome,
  fallbackSuggestions,
  active,
}: {
  locale: string;
  fallbackWelcome: string;
  fallbackSuggestions: string[];
  /**
   * The conversation starts (fetches the welcome and starters) the first time
   * this is true: when the widget panel opens, or straight away on the contact page.
   */
  active: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [welcome, setWelcome] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [welcomeFailed, setWelcomeFailed] = useState(false);
  const [stage, setStage] = useState<Stage>("discover");
  const [summary, setSummary] = useState("");
  const [fields, setFields] = useState<Fields>(EMPTY_FIELDS);
  const [manual, setManual] = useState(false);
  const started = useRef(false);
  // Turnstile: the conversation is verified once (the server then sets a cookie).
  // `verified` flips after the first accepted request; until then each request
  // carries the widget's token. `tokenFailed` = the check could not run at all.
  const tokenRef = useRef<string | null>(null);
  const verified = useRef(false);
  const [tokenReady, setTokenReady] = useState(false);
  const [tokenFailed, setTokenFailed] = useState(false);
  const [verifyResetKey, setVerifyResetKey] = useState(0);
  const onToken = useCallback((value: string | null) => {
    tokenRef.current = value;
    setTokenReady(Boolean(value));
    if (value) setTokenFailed(false);
  }, []);
  const onTokenError = useCallback(() => setTokenFailed(true), []);
  // Bumped on every reset, so a reply still in flight for the previous
  // conversation is dropped instead of landing in the new one.
  const epoch = useRef(0);

  const ask = useCallback(
    async (history: Message[]) => {
      const run = epoch.current;
      setLoading(true);
      setFailed(false);
      try {
        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locale,
            path: window.location.pathname,
            pageTitle: document.title,
            messages: history,
            turnstileToken: verified.current ? undefined : (tokenRef.current ?? undefined),
          }),
        });
        if (res.status === 403) {
          // The verification expired: ask the widget for a fresh token.
          verified.current = false;
          tokenRef.current = null;
          setTokenReady(false);
          setVerifyResetKey((key) => key + 1);
        }
        if (!res.ok) throw new Error(String(res.status));
        if (!verified.current) {
          verified.current = true;
          tokenRef.current = null;
          setTokenReady(false);
        }
        const data = (await res.json()) as Reply;
        if (run !== epoch.current) return;
        if (history.length === 0) {
          setWelcome(data.reply);
        } else {
          setMessages([...history, { role: "assistant", content: data.reply }]);
        }
        if (data.stage) {
          setStage(data.stage);
          setSuggestions(data.stage === "discover" ? data.suggestions : []);
          if (data.summary) setSummary(data.summary);
        }
        // Keep what we already knew when a reply leaves a field blank.
        if (data.fields) {
          const next = data.fields;
          setFields((prev) => ({
            name: next.name || prev.name,
            email: next.email || prev.email,
            company: next.company || prev.company,
            budget: next.budget || prev.budget,
          }));
        }
      } catch {
        if (run !== epoch.current) return;
        if (history.length === 0) {
          setWelcome(fallbackWelcome);
          setSuggestions(fallbackSuggestions);
          // Lets a surface that has nothing else to offer (the contact page)
          // fall back to the plain form rather than a chat that cannot answer.
          setWelcomeFailed(true);
        } else {
          setFailed(true);
        }
      } finally {
        if (run === epoch.current) setLoading(false);
      }
    },
    [locale, fallbackWelcome, fallbackSuggestions],
  );

  /** Ends the conversation and clears everything, so the next start begins fresh. */
  const reset = useCallback(() => {
    epoch.current += 1;
    started.current = false;
    setMessages([]);
    setWelcome("");
    setSuggestions([]);
    setDraft("");
    setLoading(false);
    setFailed(false);
    setWelcomeFailed(false);
    setStage("discover");
    setSummary("");
    setFields(EMPTY_FIELDS);
    setManual(false);
  }, []);

  // Starters are fetched the first time the conversation becomes active.
  useEffect(() => {
    if (!active || started.current) return;
    // Wait for the Turnstile check (usually under a second) unless it already
    // passed or cannot run; without it the server would refuse the first call.
    if (!verified.current && !tokenReady && !tokenFailed) return;
    started.current = true;
    void ask([]);
  }, [active, ask, tokenReady, tokenFailed]);

  const send = useCallback(
    (text: string) => {
      const content = text.trim();
      if (!content || loading) return;
      const next: Message[] = [...messages, { role: "user", content }];
      setMessages(next);
      setDraft("");
      setSuggestions([]);
      void ask(next);
    },
    [ask, loading, messages],
  );

  function submitDraft(event: FormEvent) {
    event.preventDefault();
    send(draft);
  }

  const retry = useCallback(() => void ask(messages), [ask, messages]);

  /** The filled-in form is shown once the chat has what it needs, or on request. */
  const formVisible = stage === "done" || manual;

  // Remount the form when the chat fills in different values, so the fields
  // pick up the new defaults.
  const formKey = [fields.name, fields.email, fields.company, fields.budget, summary].join("\u0001");

  return {
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
    reset,
    /** Spread onto <Turnstile /> wherever the chat is shown. */
    turnstile: { action: "assistant", onToken, onError: onTokenError, resetKey: verifyResetKey },
  };
}
