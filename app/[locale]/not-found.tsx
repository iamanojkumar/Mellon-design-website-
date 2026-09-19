import Link from "next/link";
import { Container } from "@/components/ui/Container";

export default function LocaleNotFound() {
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
          404
        </span>
        <h1 style={{ fontSize: "clamp(2.75rem, 5vw, 3.5rem)", marginBottom: "1rem" }}>
          We couldn&apos;t find that page.
        </h1>
        <p style={{ color: "var(--color-fg-muted)", fontSize: "1.25rem", marginBottom: "2rem" }}>
          The page you&apos;re looking for may have moved or never existed.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            padding: "0.9rem 1.75rem",
            borderRadius: "999px",
            background: "var(--color-ink)",
            color: "var(--color-paper)",
            fontWeight: 600,
          }}
        >
          Back to home
        </Link>
      </Container>
    </section>
  );
}
