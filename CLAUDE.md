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

Every route lives under `app/[locale]/...`. `middleware.ts` redirects (not rewrites) unlocalized paths to `/{locale}/...`, resolved from: a `mellon_locale` cookie override → `Accept-Language` header → `defaultLocale` (`en-US`). Locale layout (`app/[locale]/layout.tsx`) calls `notFound()` for any locale not in `enabledLocaleCodes` — that explicit check, not `dynamicParams`, is what keeps unknown locales from rendering. The layout deliberately leaves `dynamicParams` at its default (`true`): a nested route's own `dynamicParams = true` (e.g. `projects/[slug]`, published from Supabase without a redeploy) is silently forced to `fallback: false` if an ancestor segment sets `dynamicParams = false` — confirmed via the prerender manifest and a known Next.js issue (vercel/next.js#87738) — so routes that *do* want strict enumeration (`services/[slug]`, `industries/[slug]`, the locale-only pages) set `dynamicParams = false` themselves at their own segment. `app/[locale]/[...rest]/page.tsx` catches unknown paths under a valid locale so 404s still render inside the header/footer chrome.

**Retired URLs (`middleware.ts`, `lib/url-rules.ts`, `/admin/indexing`).** The old WordPress site left URLs Google still knows. `middleware.ts` answers 410 (with a small HTML page) for known legacy patterns, 301s a few old pages to their replacements (`LEGACY_REDIRECTS`), and also enforces rules stored in the Supabase `url_rules` table (cached ~60s). Those rules are managed in `/admin/indexing` → 404 pages tab: upload a Search Console CSV, then set 410 / 301 / ignore. Paths that look like live pages are refused. Never `Disallow` these URLs in robots — Google must be able to fetch them to see the 410.

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

**Entrance animations — required on every new page, section, block, and form.** Content animates in on load or when it scrolls into view. Use these building blocks, never one-off CSS animations, so timing and behavior stay identical site-wide:
- **Headings and body text** → `<SwiftUpText text={…} whenVisible />` (`components/motion/SwiftUpText.tsx`): slides up line by line. Put it *inside* the `<h1>`/`<h2>`/`<p>`/label element, keeping the real element for semantics and SEO. Give body text following a heading `lineDelay={0.12} delay={0.2}`. Use `whenVisible` everywhere except a page-load sequence inside `HeroSequence` (`components/blocks/Hero.tsx`), where `step` orders the pieces.
- **Buttons, tags/chips, eyebrow overlines, marquees, form controls, and other small standalone elements** → `<FadeIn whenVisible [as="span"] [delay={…}]>` (`components/motion/HeroSequence.tsx`). Stagger rows of tags/chips by ~0.04s each.
- **Card groups, FAQ lists, and any repeated grid/list of items** → render the grid/list container as `<RevealGroup [as="ul"] className={…}>` (`components/motion/RevealGroup.tsx`): the first item rises in with a fade and the rest follow one by one. It keeps the container's layout, so pass the original className. Draw dividers between cards on the cards themselves (e.g. an inset `box-shadow`), not through a grid `gap` showing the grid background — an invisible card would otherwise leave a coloured hole.
- **Header/chrome** (logo, nav links, header buttons) fade in on load at the shared `LOAD_DELAY` in `components/layout/Header.tsx`.
- Don't animate the same element with two of these, and don't add them to admin UI. All of them already respect `prefers-reduced-motion` and show content as-is with scripting off — keep that true for anything new. Landing pages built on `ServiceLanding` inherit this; a page with its own layout (including copies of `_template/`) must apply it itself.

### Route groups and landing pages (`app/[locale]/(site)/`, `app/[locale]/(landing-pages)/`, `lib/landing-pages.ts`)

`app/[locale]/layout.tsx` owns only `<html>`/`<body>`, fonts, head tags and the motion effects. Header/footer/`<main>` live one level down, in three route groups (which add nothing to the URL): `(site)` holds every marketing route and renders the site header/footer; `(landing-pages)` renders its own minimal header/footer (`components/landing/`); `(legal)` (currently just `privacy`) reuses that minimal chrome so the site and landing pages can link *to* a legal page but it links to nothing else. New marketing routes go in `(site)`; new legal pages go in `(legal)`.

Landing pages are lead-magnet / search-traffic pages at `/{locale}/{slug}`. **Nothing on the site links to them** — they're reached from search results and campaigns only, so never add them to nav, footer, or a listing; the sitemap is how they're discovered. Unlike core pages, each exists only in the locales listed for it in `lib/landing-pages.ts` — others 404 (per-page `generateStaticParams` + `dynamicParams = false`), and that same list limits the page's hreflang (`buildMetadata({ locales })`) and sitemap entries. `indexable: false` makes a page `noindex` and drops it from the sitemap. Start a new one by copying `_template/`; see the README in the group folder.

**Copy and voice — whenever the user supplies copy for any page (landing or core), first read `docs/brand-voice.md`, review the copy against its checklist, rewrite it to match the voice and for the page's target search phrase (title, description, H1, first paragraph, an H2), and tell the user what you changed and why. Flag anything that contradicts other pages, and add new voice observations or inconsistencies to that doc. Never publish superlatives ("best…") or invented facts (results, prices, timelines) that the user didn't give.**

**Thin-content rule — run this check every time a landing page is created or edited, before registering it in `lib/landing-pages.ts`.** Landing pages get no internal links, so they rank on their own content, and near-duplicate pages funnel-ing to one offer risk Google's doorway/thin-content penalties. Report the result of each check to the user; don't register the page if any fails (or set `indexable: false` if it must ship anyway).
1. **Substance:** an `indexable: true` page has ≥ 300 words of unique visible body copy (not counting header/footer/CTA labels) and at least one section beyond hero + CTA (e.g. what's included, who it's for, how it works, FAQ).
2. **Unique intent:** the page targets one search intent that no other landing or core page already serves. Never create pages that differ only by a swapped keyword, city or industry name — put those variants in one page or use different, genuinely distinct content.
3. **Not a near-duplicate:** compare against existing `copy.ts` files and core pages; > ~60% shared body copy means merge, differentiate, or mark `indexable: false`.
4. **Unique metadata:** `metaTitle`, `metaDescription` and `headline` (H1) are distinct across the site and describe what this page actually offers.
5. **Real value:** the lead magnet is described concretely (what the visitor gets, format, what happens next) — no placeholder, lorem or generic filler copy.
6. **Locales:** every locale in `locales` either has its own copy entry or is a deliberate fallback (same language, e.g. en-GB → en-US); never list a locale just to multiply pages.
7. **Structure:** exactly one `<h1>`, a logical heading order, and a working CTA.

**Demand rule — before creating a landing page, or adding a locale to an existing one, check that people search for it in that market, and warn the user if demand is low or unknown.** Translating a page is not free of SEO cost: a page nobody searches for is upkeep, a crawl-budget spend, and a possible near-duplicate of the page that does rank.
1. Name the primary search phrase in the *target language and market* (research it there; don't translate the English phrase) plus its close variants.
2. Get evidence, in this order: the user's Search Console / keyword-tool volumes for that phrase and market; else `WebSearch` proxies (do localized results exist for the phrase, who ranks, is there autocomplete/related-search support). You cannot see search volumes yourself — never invent numbers, and say so.
3. Give a verdict before writing any copy: **Demand confirmed** (evidence of meaningful volume, roughly 50+ combined monthly searches for the primary phrase and close variants), **Low** (under that, or only a handful of results/queries), or **Unknown** (no evidence). For **Low** or **Unknown**, warn the user plainly, recommend not building it (or building it `indexable: false`, or waiting for Search Console data from the existing pages), and build only if they confirm after seeing the warning.
4. Same-language locales (en-GB, en-IN) that would fall back to identical copy count as no new page: don't list them for a page unless they get their own copy for that market.
5. Record the verdict and the evidence in a comment at the top of the page's `copy.ts`.

### Static generation pattern

Every route under `app/[locale]/` exports `generateStaticParams` (locale × slug where relevant) and `dynamicParams = false`, so unknown combinations 404 instead of rendering on-demand. `services/[slug]` and `industries/[slug]` derive their params from `getServices`/`getIndustries` per enabled locale — a new service/industry is added purely via content JSON, no route changes.

## Conventions

- Path alias `@/*` maps to the repo root (`tsconfig.json`).
- Styling is plain CSS Modules per component/route, plus the shared token files — no CSS-in-JS, no utility framework.
- **Never bold Georgia** (`--font-display`) unless the user explicitly asks: use `font-weight: var(--fw-display)` on anything set in it. Headings (`h1`–`h6`) get Georgia from `styles/globals.css`, so a heading used as a small label (e.g. `<h3>` with a 600 weight) is bold Georgia — set its weight to `--fw-display`, or switch its `font-family` to `--font-body` if it should be bold.
- `temp/` is scratch/reference data (not part of the site) and is gitignored; it currently holds locale/country reference JSON and a draft consent-banner copy file, consulted when deciding which locales to launch next.
