"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/admin/actions";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./AdminNav.module.css";

const ITEMS = [
  { href: "/admin", label: "Projects" },
  { href: "/admin/indexing", label: "Indexing" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Admin">
      <div className={styles.brand}>Mellon Admin</div>
      <ul className={styles.list}>
        {ITEMS.map((item) => {
          const active =
            item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={styles.link}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className={styles.foot}>
        <ThemeToggle />
        <form action={logoutAction}>
          <button type="submit" className="a-btn">
            Log out
          </button>
        </form>
      </div>
    </nav>
  );
}
