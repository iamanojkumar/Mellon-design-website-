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

import siteEsES from "@/content/es-ES/site.json";
import servicesEsES from "@/content/es-ES/services.json";
import industriesEsES from "@/content/es-ES/industries.json";
import homeEsES from "@/content/es-ES/pages/home.json";
import aboutEsES from "@/content/es-ES/pages/about.json";
import servicesPageEsES from "@/content/es-ES/pages/services.json";
import industriesPageEsES from "@/content/es-ES/pages/industries.json";
import contactEsES from "@/content/es-ES/pages/contact.json";
import privacyEsES from "@/content/es-ES/pages/privacy.json";

import siteDeDE from "@/content/de-DE/site.json";
import servicesDeDE from "@/content/de-DE/services.json";
import industriesDeDE from "@/content/de-DE/industries.json";
import homeDeDE from "@/content/de-DE/pages/home.json";
import aboutDeDE from "@/content/de-DE/pages/about.json";
import servicesPageDeDE from "@/content/de-DE/pages/services.json";
import industriesPageDeDE from "@/content/de-DE/pages/industries.json";
import contactDeDE from "@/content/de-DE/pages/contact.json";
import privacyDeDE from "@/content/de-DE/pages/privacy.json";

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
  "de-DE": {
    site: siteDeDE,
    services: servicesDeDE,
    industries: industriesDeDE,
    pages: {
      home: homeDeDE as unknown as PageDoc,
      about: aboutDeDE as unknown as PageDoc,
      services: servicesPageDeDE as unknown as PageDoc,
      industries: industriesPageDeDE as unknown as PageDoc,
      contact: contactDeDE as unknown as PageDoc,
      privacy: privacyDeDE as unknown as PageDoc,
    },
  },
  "es-ES": {
    site: siteEsES,
    services: servicesEsES,
    industries: industriesEsES,
    pages: {
      home: homeEsES as unknown as PageDoc,
      about: aboutEsES as unknown as PageDoc,
      services: servicesPageEsES as unknown as PageDoc,
      industries: industriesPageEsES as unknown as PageDoc,
      contact: contactEsES as unknown as PageDoc,
      privacy: privacyEsES as unknown as PageDoc,
    },
  },
};
