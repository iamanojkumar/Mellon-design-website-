# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static, SEO-optimized, multi-locale marketing website for Mellon (a design agency) — Next.js App Router, hosted on Vercel, fully statically generated (`generateStaticParams` for every locale × route). No app/product, no user accounts, no e-commerce. See `SCOPE.md` for the full product spec, stack rationale, and open decisions — treat it as the source of truth and update it when scope decisions change; don't let it drift from the repo.

## Commands

```
npm run dev      # next dev
npm run build    # next build
npm run start    # next start (serve a production build)
npm run lint     # eslint .
```

There is no test suite configured. `npx tsc --noEmit` is the way to typecheck without building.

## Architecture

### Locale routing (`middleware.ts` + `lib/locale.ts`)

Every route lives under `app/[locale]/...`. `middleware.ts` redirects (not rewrites) unlocalized paths to `/{locale}/...`, resolved from: a `mellon_locale` cookie override → `Accept-Language` header → `defaultLocale` (`en-US`). Locale layout (`app/[locale]/layout.tsx`) calls `notFound()` for any locale not in `enabledLocaleCodes`, and `dynamicParams = false` means only enabled locales are ever built. `app/[locale]/[...rest]/page.tsx` catches unknown paths under a valid locale so 404s still render inside the header/footer chrome.

`content/locales.json` is the single registry of all locales (enabled and not), each with a `fallback` locale for content inheritance. **Adding a new enabled locale is a content + config change, not a restructuring**: create `content/<locale>/` files, import them in `content/registry.ts`, set `"enabled": true` in `content/locales.json`. Nothing else in code changes.

### Content model (`lib/blocks.ts`, `lib/content.ts`, `content/`)

Pages are `{ meta, blocks[] }` (`PageDoc`), stored as JSON under `content/<locale>/pages/*.json` and rendered by `components/blocks/BlockRenderer.tsx`, which switches on `block.type` (`hero`, `servicesGrid`, `industriesChips`, `process`, `closingCta`, `pageHero`, `textSections`, `serviceCards`, `industryCards`, `contact`). Adding a new block type means: a variant in the `Block` union in `lib/blocks.ts` + a component in `components/blocks/` + a case in `BlockRenderer`.

Two levels of inheritance, both driven by each locale's `fallback` chain (`lib/content.ts: getLocaleChain`, always terminating at `defaultLocale`):
- **`site.json`** (global strings: nav, footer, forms, common labels) is **deep-merged** key-by-key along the chain — a locale only needs to list what differs from its fallback.
- **Page docs, `services.json`, `industries.json`** are inherited **whole** — a locale either owns its entire page/list or inherits the fallback's entirely (arrays are never merged).

`content/registry.ts` is the manually-maintained map from locale code → its imported JSON files; this is the file to touch when wiring up a new locale's content. Copy is git-versioned JSON for now (`lib/content.ts` is the single seam where a future CMS would plug in); Supabase is only used for contact submissions, never for copy.

### Theming (`styles/tokens.css` + `styles/themes/`)

One base token file defines the full palette/type/spacing scale. Per-market files (`styles/themes/us.css`, etc.) declare only *deltas* under `:root[data-market="XX"]` — never redeclare the full palette. The `data-market` attribute is set on `<html>` in the locale layout, sourced from `LocaleConfig.market` (country, not language — e.g. `en-GB` and `en-US` are different markets but the same language).

### SEO (`lib/seo.ts`, `app/sitemap.ts`, `app/robots.ts`)

`buildMetadata()` is the shared helper every page's `generateMetadata` calls: canonical URL, per-locale `hreflang` alternates (plus `x-default`), OpenGraph/Twitter defaults. OG image falls back per-locale (`LocaleConfig.ogImage`) then to `DEFAULT_OG_IMAGE`. JSON-LD builders (`organizationJsonLd`, `breadcrumbJsonLd`, `serviceJsonLd`) pull facts from `content/organization.json` (shared, non-localized) merged with the localized `org` block of `site.json`. `app/robots.ts` disallows all on preview deployments (gated by `VERCEL_ENV`) and allows all in production.

### Contact form (`components/contact-form/`)

One shared `ContactForm` component/validation schema used on every locale's contact page — locale only changes displayed copy/fields, never logic. Flow on submit (`actions.ts`, a server action): honeypot check → zod validation (schema built per-locale from `site.forms.contact.validation` copy) → `saveContactSubmission` (writes to Supabase via direct PostgREST call, `lib/submissions.ts`, using `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`) → best-effort `notifyNewSubmission` (POSTs to a Zoho Flow webhook, `lib/notify.ts`, `CONTACT_WEBHOOK_URL`). A failed Supabase write must surface as an error to the visitor; a failed notification must not (the enquiry is already safely stored). See `.env.example` for the required server-only env vars and `supabase/migrations/` for the table schema.

### Motion system (`components/motion/`, `lib/motion-settings.ts`)

`lib/motion-settings.ts` is a plain external store (no React context) holding live-tunable settings for every motion effect, so both React components and non-React code (e.g. WebGL render loops) can read current values without re-rendering. Effects: `SmoothScroll` (Lenis), `CursorFx` (WebGL iridescent cursor trail/liquid blob), `ScrollBlur` (progressive blur on scroll), `ImageLiquify` (drag-to-liquify on images), `NavHoverVars` (nav link hover state). All respect `prefers-reduced-motion`. `components/debug/DebugPanel.tsx` is a dev-only live tuner for these settings — it's dynamically imported in `app/[locale]/layout.tsx` behind a `NODE_ENV === "development"` check so the bundler drops it entirely from production bundles.

### Static generation pattern

Every route under `app/[locale]/` exports `generateStaticParams` (locale × slug where relevant) and `dynamicParams = false`, so unknown combinations 404 instead of rendering on-demand. `services/[slug]` and `industries/[slug]` derive their params from `getServices`/`getIndustries` per enabled locale — a new service/industry is added purely via content JSON, no route changes.

## Conventions

- Path alias `@/*` maps to the repo root (`tsconfig.json`).
- Styling is plain CSS Modules per component/route, plus the shared token files — no CSS-in-JS, no utility framework.
- `temp/` is scratch/reference data (not part of the site) and is gitignored; it currently holds locale/country reference JSON and a draft consent-banner copy file, consulted when deciding which locales to launch next.
