/**
 * Content registry — one entry per locale that has its own content files.
 * A locale only lists what it overrides; everything else is inherited through
 * its `fallback` chain (see content/locales.json and lib/content.ts).
 *
 * Add a locale: create content/<locale>/ files, import them here, then set
 * "enabled": true in content/locales.json.
 */
import type { PageDoc, PageKey } from "@/lib/blocks";

import siteEnUS from "@/content/en-US/site.json";
import servicesEnUS from "@/content/en-US/services.json";
import industriesEnUS from "@/content/en-US/industries.json";
import homeEnUS from "@/content/en-US/pages/home.json";
import aboutEnUS from "@/content/en-US/pages/about.json";
import servicesPageEnUS from "@/content/en-US/pages/services.json";
import industriesPageEnUS from "@/content/en-US/pages/industries.json";
import contactEnUS from "@/content/en-US/pages/contact.json";
import privacyEnUS from "@/content/en-US/pages/privacy.json";

import siteEnGB from "@/content/en-GB/site.json";

export type SiteContent = typeof siteEnUS;

export type DeepPartial<T> = T extends readonly unknown[]
  ? T
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

export type LocaleContent = {
  /** Objects are merged key by key over the fallback; arrays replace it. */
  site?: DeepPartial<SiteContent>;
  services?: unknown[];
  industries?: unknown[];
  /** A page doc is inherited whole, or overridden whole (own layout). */
  pages?: Partial<Record<PageKey, PageDoc>>;
};

export const contentRegistry: Record<string, LocaleContent> = {
  "en-US": {
    site: siteEnUS,
    services: servicesEnUS,
    industries: industriesEnUS,
    pages: {
      home: homeEnUS as unknown as PageDoc,
      about: aboutEnUS as unknown as PageDoc,
      services: servicesPageEnUS as unknown as PageDoc,
      industries: industriesPageEnUS as unknown as PageDoc,
      contact: contactEnUS as unknown as PageDoc,
      privacy: privacyEnUS as unknown as PageDoc,
    },
  },
  // en-GB inherits everything from en-US and overrides only what differs.
  "en-GB": {
    site: siteEnGB,
  },
};
