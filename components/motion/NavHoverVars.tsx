"use client";

import { useEffect } from "react";
import { getSettings, subscribeSettings } from "@/lib/motion-settings";

/**
 * Publishes the nav-hover settings as CSS custom properties on <html>, which
 * Header.module.css reads. Live-tunable from the dev debugger; production always
 * gets the defaults.
 */
export function NavHoverVars() {
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const c = getSettings();
      root.style.setProperty("--nav-hover-blur", c.navHoverEnabled ? `${c.navHoverBlur}px` : "0px");
      root.style.setProperty("--nav-hover-dim", c.navHoverEnabled ? String(c.navHoverDim) : "1");
    };
    apply();
    const unsubscribe = subscribeSettings(apply);
    return () => {
      unsubscribe();
      root.style.removeProperty("--nav-hover-blur");
      root.style.removeProperty("--nav-hover-dim");
    };
  }, []);
  return null;
}
