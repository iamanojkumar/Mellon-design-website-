"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
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

/** Right-pointing chevron; rotated in CSS where it points back. */
function Chevron({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 3.5L10.5 8L6 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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

  // Mobile menu: a full-screen sheet. `panel` is the nav href whose submenu is showing
  // (null = the top level); a submenu slides in over the top level, Back slides it out.
  const [panel, setPanel] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeMenu = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) menuButtonRef.current?.focus();
  };

  useEffect(() => {
    if (!open) setPanel(null);
    // React 18 has no `inert` prop; a closed sheet must be out of the tab order and the
    // accessibility tree even while its closing animation plays.
    sheetRef.current?.toggleAttribute("inert", !open);
    if (!open) return;

    // The sheet starts below the bar, whatever height the bar has.
    const setBarHeight = () => {
      if (barRef.current) {
        headerRef.current?.style.setProperty("--bar-h", `${barRef.current.offsetHeight}px`);
      }
    };
    setBarHeight();

    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";

    const desktop = window.matchMedia("(min-width: 900px)");
    const onDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", onDesktop);
    window.addEventListener("resize", setBarHeight);
    return () => {
      html.style.overflow = prevOverflow;
      desktop.removeEventListener("change", onDesktop);
      window.removeEventListener("resize", setBarHeight);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // An open language list closes itself first.
      if (sheetRef.current?.querySelector('[aria-haspopup][aria-expanded="true"]')) return;
      // A submenu steps back first; the top level closes the menu.
      if (panel) setPanel(null);
      else closeMenu(true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, panel]);

  // Move focus with the panels so keyboard and screen-reader users land where they look:
  // into a submenu on its Back button, and out of it on the item that opened it.
  const prevPanel = useRef<string | null>(null);
  useEffect(() => {
    const from = prevPanel.current;
    prevPanel.current = panel;
    const sheet = sheetRef.current;
    if (!open || !sheet || from === panel) return;
    const target = panel
      ? sheet.querySelector<HTMLElement>(`[data-panel="${panel}"] [data-back]`)
      : sheet.querySelector<HTMLElement>(`[data-opens="${from}"]`);
    target?.focus({ preventScroll: true });
  }, [panel, open]);

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
      ref={headerRef}
      className={styles.header}
      data-hidden={hidden && !open}
      data-mega={megaOpen ? "" : undefined}
      data-menu-open={open || undefined}
      onFocus={() => setHidden(false)}
    >
      <div ref={barRef} className={styles.bar}>
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
            <LanguageSwitcher locale={locale} variant="compact" copy={common.languageSwitcher} />
          </div>
          <div className={styles.ctaSlot}>
            <Cta label={cta.label} href={`${localePrefix}${cta.href}`} variant="primary" context="home" />
          </div>
        </FadeIn>

        <FadeIn as="span" whenVisible delay={LOAD_DELAY} className={styles.menuWrap}>
          <button
            ref={menuButtonRef}
            type="button"
            className={styles.menuButton}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span className={styles.menuIcon} data-open={open} />
            <span className="visually-hidden">{open ? common.menuClose : common.menu}</span>
          </button>
        </FadeIn>
      </div>

      <div
        ref={sheetRef}
        className={styles.sheet}
        id="mobile-nav"
        data-open={open}
        data-sub={panel ? "" : undefined}
        data-lenis-prevent
      >
        <div className={styles.sheetPanels}>
          <nav className={styles.sheetPanel} data-panel="root" aria-label={common.primaryNavAria}>
            <ul className={styles.sheetList}>
              {nav.map((item, index) => {
                const href = `${localePrefix}${item.href}`;
                const isActive = pathname === href || pathname.startsWith(`${href}/`);
                const rowStyle = { "--i": index } as CSSProperties;
                return (
                  <li key={item.href} className={styles.sheetItem} style={rowStyle}>
                    {mega[item.href] ? (
                      <button
                        type="button"
                        className={styles.sheetLink}
                        data-active={isActive || undefined}
                        data-opens={item.href}
                        aria-expanded={panel === item.href}
                        onClick={() => setPanel(item.href)}
                      >
                        <span>{item.label}</span>
                        <Chevron className={styles.sheetChevron} />
                      </button>
                    ) : (
                      <Link
                        href={href}
                        className={styles.sheetLink}
                        data-active={isActive || undefined}
                        aria-current={pathname === href ? "page" : undefined}
                        onClick={() => closeMenu()}
                      >
                        <span>{item.label}</span>
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {nav.map((item) => {
            const groups = mega[item.href];
            if (!groups) return null;
            const href = `${localePrefix}${item.href}`;
            const isCurrent = panel === item.href;
            return (
              <div
                key={item.href}
                className={`${styles.sheetPanel} ${styles.sheetSub}`}
                data-panel={item.href}
                data-current={isCurrent}
              >
                <button type="button" className={styles.sheetBack} data-back onClick={() => setPanel(null)}>
                  <Chevron className={styles.sheetBackIcon} />
                  {common.menuBack}
                </button>
                <div className={styles.sheetSubHead}>
                  <p className={styles.sheetSubTitle}>{item.label}</p>
                  <Link href={href} className={styles.sheetViewAll} onClick={() => closeMenu()}>
                    {common.menuViewAll}
                    <Chevron />
                  </Link>
                </div>
                {groups.map((group) => (
                  <div key={group.label} className={styles.sheetGroup}>
                    {/* Not a heading: the header sits above the page's <h1>. */}
                    <p className={styles.sheetGroupLabel}>{group.label}</p>
                    <ul className={styles.sheetSubList}>
                      {group.items.map((entry) => (
                        <li key={entry.href}>
                          <Link
                            href={entry.href}
                            className={styles.sheetSubLink}
                            aria-current={pathname === entry.href ? "page" : undefined}
                            onClick={() => closeMenu()}
                          >
                            {entry.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Close on the CTA too: on the contact page itself the route doesn't change. */}
        <div
          className={styles.sheetFooter}
          onClick={(event) => {
            if ((event.target as Element).closest("a[data-cta-context]")) closeMenu();
          }}
        >
          <Cta label={cta.label} href={`${localePrefix}${cta.href}`} variant="primary" context="home" className={styles.sheetCta} />
        </div>
      </div>
    </header>
  );
}
