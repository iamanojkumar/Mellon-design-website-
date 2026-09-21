import Link from "next/link";
import { getSiteContent } from "@/lib/content";
import { defaultLocale, getLocaleConfig } from "@/lib/locale";

export default function GlobalNotFound() {
  const { notFound } = getSiteContent(defaultLocale);
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
        <h1 style={{ fontSize: "2.5rem", margin: 0 }}>{notFound.headline}</h1>
        <p style={{ fontFamily: "Arial, sans-serif", opacity: 0.8 }}>
          <Link href="/" style={{ color: "#f2f2ef" }}>
            {notFound.back}
          </Link>
        </p>
      </body>
    </html>
  );
}
