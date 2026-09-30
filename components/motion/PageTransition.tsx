"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogoIconLoop } from "@/components/brand/AnimatedLogo";
import { setPageHold } from "@/lib/page-transition";
import styles from "./PageTransition.module.css";

/** Curtain rising over the old page (ms). Keep in sync with --pt-cover in the CSS. */
const COVER_MS = 650;
/** Curtain leaving upward (ms). Keep in sync with --pt-reveal in the CSS. */
const REVEAL_MS = 850;
/** Entrance animations of the new page start this long after the curtain begins to leave. */
const RELEASE_AFTER_MS = 260;
/** Once covered, how long the new page may take before the loader appears. */
const LOADER_AFTER_MS = 250;
/** Give up waiting and reveal whatever is there (e.g. the navigation failed). */
const GIVE_UP_MS = 12000;

/** On a full page load the preloader stays at least this long (ms since navigation start), so the animation reads. */
const BOOT_MIN_MS = 900;

type Phase = "idle" | "cover" | "reveal";

type Pending = { from: string; covered: boolean; routed: boolean };

/**
 * Page transition: a curtain rises from the bottom, pushing the old page up,
 * the route changes underneath it, then the curtain carries on upward to
 * uncover the new page as it rises into place. If the new page is not ready by
 * the time the curtain has landed, a loader shows on it until it is.
 *
 * The same curtain is the preloader: on a full page load it covers the page from
 * the first paint (it is server-rendered closed) showing the loader animation,
 * and lifts once the page, its images and fonts have loaded.
 *
 * Internal links are intercepted in the capture phase so <Link> and plain <a>
 * behave the same and no call site changes. Skipped for reduced motion,
 * modified clicks, new tabs, downloads, external and same-page links.
 */
export function PageTransition({ loadingLabel }: { loadingLabel: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("cover");
  const [loading, setLoading] = useState(true);
  // True until the preloader has lifted the first time.
  const [boot, setBoot] = useState(true);
  const pending = useRef<Pending | null>(null);
  const timers = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  const reveal = () => {
    const root = document.documentElement;
    setLoading(false);
    setBoot(false);
    setPhase("reveal");
    root.dataset.pageTransition = "reveal";
    clearTimers();
    later(() => setPageHold(false), RELEASE_AFTER_MS);
    later(() => {
      pending.current = null;
      setPhase("idle");
      delete root.dataset.pageTransition;
    }, REVEAL_MS + 50);
  };
  const revealRef = useRef(reveal);
  revealRef.current = reveal;

  // The route committed while (or after) the curtain was rising.
  useEffect(() => {
    const p = pending.current;
    if (!p || p.routed || pathname === p.from) return;
    p.routed = true;
    if (p.covered) revealRef.current();
  }, [pathname]);

  // Preloader: hold the page under the curtain until it has loaded, then lift.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setBoot(false);
      setLoading(false);
      setPhase("idle");
      setPageHold(false);
      return;
    }
    setPageHold(true);
    let cancelled = false;
    const loaded =
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise<void>((resolve) => window.addEventListener("load", () => resolve(), { once: true }));
    Promise.all([loaded, document.fonts?.ready ?? Promise.resolve()]).then(() => {
      if (cancelled) return;
      later(() => revealRef.current(), Math.max(0, BOOT_MIN_MS - performance.now()));
    });
    later(() => revealRef.current(), GIVE_UP_MS);
    return () => {
      cancelled = true;
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const onClick = (event: MouseEvent) => {
      if (reduced.matches || pending.current) return;
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor || anchor.hasAttribute("download") || anchor.hasAttribute("data-no-transition")) return;
      const target = anchor.getAttribute("target");
      if (target && target !== "_self") return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return; // same page or #hash: leave to the browser

      event.preventDefault();
      event.stopPropagation();

      const root = document.documentElement;
      const p: Pending = { from: window.location.pathname, covered: false, routed: false };
      pending.current = p;
      setPageHold(true);
      setPhase("cover");
      root.dataset.pageTransition = "cover";
      router.push(url.pathname + url.search + url.hash);

      later(() => {
        p.covered = true;
        if (p.routed) revealRef.current();
        else later(() => setLoading(true), LOADER_AFTER_MS);
      }, COVER_MS);
      later(() => revealRef.current(), GIVE_UP_MS);
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearTimers();
      setPageHold(false);
      delete document.documentElement.dataset.pageTransition;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  return (
    <div className={styles.curtain} data-phase={phase} data-loading={loading} data-boot={boot} aria-hidden={phase === "idle"}>
      <div className={styles.loader} role="status" aria-live="polite">
        <span className="visually-hidden">{phase === "idle" ? "" : loadingLabel}</span>
        <LogoIconLoop active={phase === "cover" && loading} />
      </div>
    </div>
  );
}
