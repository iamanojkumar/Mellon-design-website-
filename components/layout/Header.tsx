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
import type { MegaMenus } from "@/lib/mega-menu";
import styles from "./Header.module.css";

/** Seconds before the header fades in on page load; nav and buttons share it (the logo wordmark uses the same). */
const LOAD_DELAY = 0.4;

/** Scroll depth (px) before the header is allowed to hide. */
const HIDE_AFTER = 80;

/** Milliseconds the mega-menu stays open after the pointer leaves it. */
const MEGA_CLOSE_DELAY = 150;

/** A mega-menu category with more entries than this spans two columns. */
const WIDE_GROUP_MIN = 5;

type NavItem ={ label: string; href: string };

type HeaderProps = {
  locale: string;
  nav: NavItem[];
  cta: NavItem;
  common: SiteContent["common"];
  /** Mega-menu panels, keyed by nav href. Items without an entry stay plain links. */
  mega?: MegaMenus;
};

export function Header({ locale, nav, cta, common, mega = {} }: HeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState<string | null>(null);

  // Closing is delayed a beat so the pointer can cross the gap between a nav link and its
  // panel without the menu snapping shut; entering either one cancels the pending close.
  const closeTimer = useRef<number | null>(null);
  const cancelClose = () => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const openMega = (href: string) => {
    cancelClose();
    setMegaOpen(href);
  };
  const closeMega = (delay = MEGA_CLOSE_DELAY) => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setMegaOpen(null), delay);
  };
  useEffect(() => cancelClose, []);

  useEffect(() => {
    setOpen(false);
    cancelClose();
    setMegaOpen(null);
  }, [pathname]);

  useEffect(() => {
    if (!megaOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMegaOpen(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [megaOpen]);

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
            const groups = mega[item.href];
            const link = (
              <NavSlideLink
                href={href}
                className={isActive ? `${styles.navLink} ${styles.active}` : styles.navLink}
              >
                {item.label}
              </NavSlideLink>
            );
            const isOpen = megaOpen === item.href;
            return (
              <FadeIn key={item.href} as="span" whenVisible delay={LOAD_DELAY + index * 0.08}>
                {groups ? (
                  <span
                    className={styles.megaItem}
                    onMouseEnter={() => openMega(item.href)}
                    onMouseLeave={() => closeMega()}
                    onFocus={() => openMega(item.href)}
                    onBlur={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget)) closeMega(0);
                    }}
                  >
                    {link}
                    <div className={styles.megaPanel} data-open={isOpen} data-lenis-prevent>
                      <div className={styles.megaInner}>
                        {groups.map((group) => (
                          <div
                            key={group.label}
                            className={group.items.length > WIDE_GROUP_MIN ? styles.megaWide : undefined}
                          >
                            <p className={styles.megaLabel}>{group.label}</p>
                            <ul className={styles.megaList}>
                              {group.items.map((entry) => (
                                <li key={entry.href}>
                                  <Link href={entry.href} className={styles.megaLink}>
                                    {entry.name}
                                    {entry.tagline && <span className={styles.megaSub}>{entry.tagline}</span>}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </span>
                ) : (
                  link
                )}
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
          {nav.map((item) => {
            const groups = mega[item.href];
            const href = `${localePrefix}${item.href}`;
            if (!groups) {
              return (
                <Link key={item.href} href={href} className={styles.mobileLink}>
                  {item.label}
                </Link>
              );
            }
            return (
              <details key={item.href} className={styles.mobileGroup}>
                <summary className={styles.mobileLink}>{item.label}</summary>
                <Link href={href} className={styles.mobileSubLink}>
                  {item.label}
                </Link>
                {groups.map((group) => (
                  <div key={group.label}>
                    <p className={styles.megaLabel}>{group.label}</p>
                    <ul className={styles.megaList}>
                      {group.items.map((entry) => (
                        <li key={entry.href}>
                          <Link href={entry.href} className={styles.mobileSubLink}>
                            {entry.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </details>
            );
          })}
          <div className={styles.mobileLangSlot}>
            <LanguageSwitcher locale={locale} copy={common.languageSwitcher} />
          </div>
          <Cta label={cta.label} href={`${localePrefix}${cta.href}`} variant="primary" context="home" className={styles.mobileCta} />
        </div>
      )}
    </header>
  );
}
