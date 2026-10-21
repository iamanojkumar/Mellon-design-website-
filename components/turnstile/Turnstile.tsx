"use client";

import { useEffect, useRef } from "react";

type TurnstileApi = {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile missing")));
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("turnstile failed to load"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/**
 * Cloudflare Turnstile widget. Hidden unless Cloudflare needs the visitor to do
 * something (`interaction-only`), so most visitors never see it.
 *
 * Inside a <form> it adds a `cf-turnstile-response` field, which the server
 * action reads. Tokens are single use: bump `resetKey` after each submission
 * attempt to get a fresh one. `onToken(null)` means the token was spent or
 * expired and a new one is on its way; `onError` means the check could not run
 * (script blocked, no sitekey), and the server will reject without a token.
 */
export function Turnstile({
  action,
  onToken,
  onError,
  resetKey,
}: {
  action: string;
  onToken: (token: string | null) => void;
  onError?: () => void;
  resetKey?: unknown;
}) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const callbacks = useRef({ onToken, onError });
  callbacks.current = { onToken, onError };

  useEffect(() => {
    const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY;
    const element = container.current;
    if (!sitekey || !element) {
      callbacks.current.onError?.();
      return;
    }
    let cancelled = false;
    loadTurnstile()
      .then((api) => {
        if (cancelled) return;
        widgetId.current = api.render(element, {
          sitekey,
          action,
          appearance: "interaction-only",
          callback: (token: string) => callbacks.current.onToken(token),
          "expired-callback": () => callbacks.current.onToken(null),
          "timeout-callback": () => callbacks.current.onToken(null),
          "error-callback": () => callbacks.current.onError?.(),
        });
      })
      .catch(() => {
        if (!cancelled) callbacks.current.onError?.();
      });
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [action]);

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (widgetId.current && window.turnstile) {
      callbacks.current.onToken(null);
      window.turnstile.reset(widgetId.current);
    }
  }, [resetKey]);

  return <div ref={container} data-turnstile-action={action} />;
}
