import type { ReactNode } from "react";
import "@/styles/tokens.css";
import "./admin.css";
import { THEME_BOOTSTRAP_SCRIPT } from "@/lib/admin-theme";

export const metadata = { robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    // data-theme is rendered as "light" and corrected before paint by the
    // bootstrap script; suppressHydrationWarning stops React complaining about
    // the attribute it finds already changed. See lib/admin-theme.ts.
    <html lang="en" data-theme="light" data-theme-pref="system" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
        {children}
      </body>
    </html>
  );
}
