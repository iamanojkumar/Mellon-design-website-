"use client";

import { getSiteContent } from "@/lib/content";
import { defaultLocale, getLocaleConfig } from "@/lib/locale";

// Last-resort boundary: replaces the whole document when the root layout
// itself fails, so it cannot rely on the locale layout, header or global CSS.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { errorPage } = getSiteContent(defaultLocale);

  return (
    <html lang={getLocaleConfig(defaultLocale)?.language}>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          fontFamily: "Georgia, serif",
          background: "#1a2b3c",
          color: "#f2f2ef",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <h1 style={{ fontSize: "2.5rem", margin: 0 }}>{errorPage.headline}</h1>
        <p style={{ fontFamily: "Arial, sans-serif", opacity: 0.8, maxWidth: "36rem", margin: 0 }}>
          {errorPage.body}
        </p>
        <div style={{ display: "flex", gap: "1rem", fontFamily: "Arial, sans-serif" }}>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "999px",
              border: "1px solid #f2f2ef",
              background: "transparent",
              color: "#f2f2ef",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            {errorPage.retry}
          </button>
          {/* Plain anchor on purpose: forces a full reload when the router may be broken. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" style={{ color: "#f2f2ef", alignSelf: "center" }}>
            {errorPage.home}
          </a>
        </div>
      </body>
    </html>
  );
}
