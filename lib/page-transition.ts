"use client";

import { useSyncExternalStore } from "react";

/**
 * Tiny external store: true while a page transition is covering the screen and
 * the incoming page must not play its entrance animations yet (they would finish
 * behind the curtain). Entrance components wait on `usePageReady()`. Held from
 * the first paint in the browser (the preloader covers the page until it has
 * loaded) and during every page transition; always ready on the server.
 */
let holding = typeof window !== "undefined";
const listeners = new Set<() => void>();

export function setPageHold(value: boolean) {
  if (holding === value) return;
  holding = value;
  listeners.forEach((fn) => fn());
}

export function isPageHeld() {
  return holding;
}

export function subscribePageHold(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** False while a page transition is holding the incoming page's entrance animations. */
export function usePageReady() {
  return !useSyncExternalStore(subscribePageHold, isPageHeld, () => false);
}
