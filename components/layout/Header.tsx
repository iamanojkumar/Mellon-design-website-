"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { SiteContent } from "@/lib/content";
import { Cta } from "@/components/cta/Cta";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { NavScrambleLink } from "@/components/layout/NavScrambleLink";
import styles from "./Header.module.css";

type NavItem = { label: string; href: string };

type HeaderProps = {
  locale: string;
  nav: NavItem[];
  cta: NavItem;
  common: SiteContent["common"];
};

export function Header({ locale, nav, cta, common }: HeaderProps) {
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
        <Link href={homeHref} className={styles.logo} aria-label={common.homeAria}>
          <Image
            src="/brand/logo_color_light_transparentbg.png"
            alt="Mellon"
            width={252}
            height={80}
            className={styles.logoFull}
            data-no-fx
            priority
          />
          <Image
            src="/brand/icon_color.png"
            alt="Mellon"
            width={80}
            height={80}
            className={styles.logoIcon}
            data-no-fx
            priority
          />
        </Link>

        <nav className={styles.nav} aria-label={common.primaryNavAria}>
          {nav.map((item) => {
            const href = `${localePrefix}${item.href}`;
            const isActive =
              pathname === href || pathname.startsWith(`${href}/`);
            return (
              <NavScrambleLink
                key={item.href}
                href={href}
                className={isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
              >
                {item.label}
              </NavScrambleLink>
            );
          })}
        </nav>

        <div className={styles.actions}>
          <div className={styles.langSlot}>
            <LanguageSwitcher locale={locale} copy={common.languageSwitcher} />
          </div>
          <div className={styles.ctaSlot}>
            <Cta label={cta.label} href={`${localePrefix}${cta.href}`} variant="primary" context="home" />
          </div>
        </div>

        <button
          type="button"
          className={styles.menuButton}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className={styles.menuIcon} data-open={open} />
          <span className="visually-hidden">{common.menu}</span>
        </button>
      </div>

      {open && (
        <div className={styles.mobileNav} id="mobile-nav">
          {nav.map((item) => (
            <Link key={item.href} href={`${localePrefix}${item.href}`} className={styles.mobileLink}>
              {item.label}
            </Link>
          ))}
          <div className={styles.mobileLangSlot}>
            <LanguageSwitcher locale={locale} copy={common.languageSwitcher} />
          </div>
          <Cta label={cta.label} href={`${localePrefix}${cta.href}`} variant="primary" context="home" className={styles.mobileCta} />
        </div>
      )}
    </header>
  );
}
