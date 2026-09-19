"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Cta } from "@/components/cta/Cta";
import styles from "./Header.module.css";

type NavItem = { label: string; href: string };

type HeaderProps = {
  locale: string;
  nav: NavItem[];
  cta: NavItem;
};

export function Header({ locale, nav, cta }: HeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const localePrefix = `/${locale}`;
  const homeHref = localePrefix;

  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <Link href={homeHref} className={styles.logo} aria-label="Mellon home">
          <Image
            src="/brand/logo_color_lightbg.png"
            alt="Mellon"
            width={252}
            height={80}
            className={styles.logoFull}
            priority
          />
          <Image
            src="/brand/icon_color_lightbg.png"
            alt="Mellon"
            width={80}
            height={80}
            className={styles.logoIcon}
            priority
          />
        </Link>

        <nav className={styles.nav} aria-label="Primary">
          {nav.map((item) => {
            const href = `${localePrefix}${item.href}`;
            const isActive =
              pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={item.href}
                href={href}
                className={isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.ctaSlot}>
          <Cta label={cta.label} href={`${localePrefix}${cta.href}`} variant="primary" context="home" />
        </div>

        <button
          type="button"
          className={styles.menuButton}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className={styles.menuIcon} data-open={open} />
          <span className="visually-hidden">Menu</span>
        </button>
      </div>

      {open && (
        <div className={styles.mobileNav} id="mobile-nav">
          {nav.map((item) => (
            <Link key={item.href} href={`${localePrefix}${item.href}`} className={styles.mobileLink}>
              {item.label}
            </Link>
          ))}
          <Cta label={cta.label} href={`${localePrefix}${cta.href}`} variant="primary" context="home" className={styles.mobileCta} />
        </div>
      )}
    </header>
  );
}
