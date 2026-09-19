import Link from "next/link";

export default function RootNotFound() {
  return (
    <html lang="en">
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
          background: "#00162a",
          color: "#ffffff",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <h1 style={{ fontSize: "2.5rem", margin: 0 }}>Page not found</h1>
        <p style={{ fontFamily: "Arial, sans-serif", opacity: 0.8 }}>
          <Link href="/" style={{ color: "#ffffff" }}>
            Return home
          </Link>
        </p>
      </body>
    </html>
  );
}
