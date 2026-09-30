"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { SiteContent } from "@/lib/content";
import { AnimatedLogo } from "@/components/brand/AnimatedLogo";
import { Cta } from "@/components/cta/Cta";
import { FadeIn } from "@/components/motion/HeroSequence";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { NavSlideLink } from "@/components/layout/NavSlideLink";
import styles from "./Header.module.css";

/** Seconds before the header fades in on page load; nav and buttons share it (the logo wordmark uses the same). */
const LOAD_DELAY = 0.4;

/** Scroll depth (px) before the header is allowed to hide. */
const HIDE_AFTER = 80;

type NavItem ={ label: string; href: string };

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

  // Slide the header away while scrolling down, bring it back on any scroll up.
  const [hidden, setHidden] = useState(false);
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = Math.max(window.scrollY, 0);
      const delta = y - lastY;
      if (Math.abs(delta) < 6) return; // ignore jitter
      lastY = y;
      if (y < HIDE_AFTER || openRef.current) setHidden(false);
      else setHidden(delta > 0);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const localePrefix = `/${locale}`;
  const homeHref = localePrefix;

  return (
    <header
      className={styles.header}
      data-hidden={hidden && !open}
      onFocus={() => setHidden(false)}
    >
      <div className={styles.bar}>
        <Link href={homeHref} className={styles.logo} aria-label={common.homeAria}>
          <AnimatedLogo />
        </Link>

        <nav className={styles.nav} aria-label={common.primaryNavAria}>
          {nav.map((item, index) => {
            const href = `${localePrefix}${item.href}`;
            const isActive =
              pathname === href || pathname.startsWith(`${href}/`);
            return (
              <FadeIn key={item.href} as="span" whenVisible delay={LOAD_DELAY + index * 0.08}>
                <NavSlideLink
                  href={href}
                  className={isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
                >
                  {item.label}
                </NavSlideLink>
              </FadeIn>
            );
          })}
        </nav>

        <FadeIn whenVisible delay={LOAD_DELAY} className={styles.actions}>
          <div className={styles.langSlot}>
            <LanguageSwitcher locale={locale} copy={common.languageSwitcher} />
          </div>
          <div className={styles.ctaSlot}>
            <Cta label={cta.label} href={`${localePrefix}${cta.href}`} variant="primary" context="home" />
          </div>
        </FadeIn>

        <FadeIn as="span" whenVisible delay={LOAD_DELAY} className={styles.menuWrap}>
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
        </FadeIn>
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
