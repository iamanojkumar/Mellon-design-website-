"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { getSiteContent } from "@/lib/content";
import { defaultLocale, isEnabledLocale } from "@/lib/locale";
import { Container } from "@/components/ui/Container";

export default function LocaleError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams<{ locale?: string }>();
  const locale =
    params.locale && isEnabledLocale(params.locale) ? params.locale : defaultLocale;
  const { errorPage } = getSiteContent(locale);

  const button = {
    display: "inline-flex",
    padding: "0.9rem 1.75rem",
    borderRadius: "999px",
    fontWeight: 600,
    fontSize: "inherit",
    cursor: "pointer",
  } as const;

  return (
    <section style={{ padding: "6rem 0" }}>
      <Container>
        <span
          style={{
            display: "inline-block",
            fontSize: "0.8125rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            background: "var(--gradient-brand)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            marginBottom: "0.75rem",
          }}
        >
          {errorPage.eyebrow}
        </span>
        <h1 style={{ fontSize: "clamp(2.75rem, 5vw, 3.5rem)", marginBottom: "1rem" }}>
          {errorPage.headline}
        </h1>
        <p style={{ color: "var(--color-fg-muted)", fontSize: "1.25rem", marginBottom: "2rem" }}>
          {errorPage.body}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          <button
            type="button"
            onClick={reset}
            style={{
              ...button,
              background: "var(--color-ink)",
              color: "var(--color-paper)",
              border: "1px solid var(--color-ink)",
            }}
          >
            {errorPage.retry}
          </button>
          <Link
            href={`/${locale}`}
            style={{ ...button, border: "1px solid var(--color-border)", color: "var(--color-fg)" }}
          >
            {errorPage.home}
          </Link>
        </div>
      </Container>
    </section>
  );
}
