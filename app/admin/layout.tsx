import type { ReactNode } from "react";
import "@/styles/tokens.css";
import "./admin.css";

export const metadata = { robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
