# Mellon Website — Project Scope

Status: en-US build scaffolded (Home, Services x10, Industries x16, About, Contact — see repo). This document is the source of truth for what the site is, how it's built, and what's still undecided. Update it as decisions are made — don't let the repo drift from this.

## 1. What this is

A static, SEO-optimized, high-performance marketing website for Mellon. No product/app, no user accounts, no e-commerce — purely informational/brand pages.

**Pages (initial set):**
- Home
- Services (index + individual service pages)
- Industries (index + individual industry pages)
- About / "how Mellon operates"
- Contact

No client project portfolio at launch.

## 2. Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) |
| Hosting | Vercel |
| Rendering | Fully static (`generateStaticParams` for every locale × route) |
| Styling | CSS custom properties (`styles/tokens.css`) + plain CSS Modules per component/route — **decided** |
| Animation | Framer Motion (`motion`) — pending confirmation depending on preloader asset format |
| Form handling | Next.js Server Actions, one shared component |
| Validation | zod (shared client + server schema) |

## 3. Localization

- **Not** English-everywhere. English is the **default/fallback**, actual language per visitor is **auto-detected** (Accept-Language header, optionally geo) and served automatically on first visit.
- Locale is visible in the URL as a path segment, using **BCP-47 codes** (e.g. `/en-US`, `/de-DE`, `/hi-IN`) — matches `hreflang` conventions directly.
- Detection happens in `middleware.ts`: redirect (not rewrite) from `/` to the resolved locale, with a cookie to persist manual overrides via a locale switcher.
- Content is locale-scoped (real translated copy per locale, not just config), with a fallback chain (e.g. `de-CH` → `de-DE` → `en-US`) so a locale can launch with partial translation coverage.
- **Design/branding differs slightly per market/country** (not per language) — a market can override theme tokens (accent color, contact details) independently of which language is being displayed.

**Priority — locale-aware sharing:** WhatsApp/social crawlers send no Accept-Language, so link previews follow the shared URL. Visitors are auto-redirected to `/{locale}/...`, so the URL they copy carries their locale. Each live locale must therefore ship its own translated title, description and (optionally) OG image via `ogImage` in `content/locales.json`. Default OG image is `/brand/icon_color_lightbg.png` when none is set. `x-default` hreflang and `og:locale:alternate` are already emitted.

### Content model (built)

- Pages are `{ meta, blocks[] }` (`lib/blocks.ts`, `content/<locale>/pages/*.json`), rendered by `components/blocks/BlockRenderer`. A locale controls layout by owning its own `blocks` list (order, which blocks appear, copy, images); otherwise it inherits the page whole from its fallback.
- Global strings (`content/<locale>/site.json`) are deep-merged along the fallback chain, so a locale lists only what differs (e.g. `en-GB` overrides just the budget placeholder).
- Fallback chain comes from `fallback` in `content/locales.json`, always ending at `en-US` (e.g. `de-CH` → `de-DE` → `en-US`).
- **Add a locale:** create `content/<locale>/` files → import in `content/registry.ts` → set `"enabled": true`. Nothing else in code changes.
- Copy stays in git-versioned JSON for now. A CMS can replace the source later behind `lib/content.ts` (single seam); Supabase is used for contact submissions only, not for copy.

### Locale rollout plan

Ranked by where agencies get hired (cross-border buyers work in English; local-language sites pay off with domestic mid-market buyers) — a hypothesis to check against real lead data.

| Tier | Locales | Notes |
|---|---|---|
| Live | `en-US`, `en-GB`, `de-DE`, `es-ES`, `fr-FR`, `nl-NL` | `en-GB` inherits from `en-US`, overrides currency; `de-DE` fully translated (formal "Sie"); `es-ES` fully translated (informal "tú"); `fr-FR` fully translated (formal "vous"); `nl-NL` fully translated (informal "je") |
| 1 — cheap English variants | `en-AU`, `en-CA`, `en-IN` | Spelling/currency only; entries exist (disabled). `en-AU`/`en-IN` inherit `en-GB` |
| 2 — remaining variants (translations done) | `fr-CA` (inherits `fr-FR`), `de-AT` / `de-CH` (inherit `de-DE`) and `es-MX` (inherits `es-ES`) once enabled | Variants inherit their base language |
| 3 — niche / high effort | `zh-CN` (Chinese companies going overseas; note GTM/Google services are blocked in mainland China and hosting speed needs review), `ja-JP` (domestic agencies dominate; needs a professional translation) | `zh-CN` stays a stated priority for the outbound-brands niche |
| Later (not in `locales.json` yet) | `pt-BR`, `hi-IN`, `ar-AE` | Buyers mostly use English; `ar-AE` needs right-to-left layout site-wide. Add entries only when work starts |

The language switcher lists **enabled locales only** (no placeholders). Per locale before enabling: translated `site.json` + pages + services/industries, OG image if different, a copy read-through, privacy policy review for that market, consent-banner copy (`temp/consent-banner.html` `COPY` object). Germany additionally requires an **Impressum** (legal notice with company details) — not built yet.

**Open decision:** which locales are live at launch. Full country/language reference data lives in `temp/countries_2026_with_languages.json` and `temp/language_codes.json` — used to inform this choice, not a commitment to support all of them immediately.

## 4. Design tokens & theming

- Single base token file (`styles/tokens.css`) defines color, type scale, spacing, radius once.
- Per-market override files (`styles/themes/us.css`, `de.css`, ...) only declare the *deltas* — never redeclare the full palette.
- Editing brand-wide values (colors, typography) means touching exactly one file.
- Market override is applied via a `data-market` attribute set in the locale layout.

## 5. Shared components (non-negotiable — no duplication per page/locale)

- **CTA** (`components/cta/Cta.tsx`) — one component, `variant` + `context` props (`service` | `industry` | `contact`), copy sourced from page content, appears in-page relevant to content.
- **Contact form** (`components/contact-form/ContactForm.tsx`) — one component instance used on every contact page in every locale. Validation schema shared between client and server action. Locale only changes displayed copy/fields, never logic.

## 6. Motion

- **Page transitions**: client-side navigations slide the new page up seamlessly (`AnimatePresence`, keyed by pathname). Persistent chrome (header/footer) sits outside the animated region so it doesn't re-animate per navigation. Does not affect first hard-load or non-JS crawlers — static HTML is unaffected, so this is SEO-neutral.
- **Preloader**: plays once per session on first load (`sessionStorage` gate), covers the very first paint. Asset is user-provided — not yet received. Config isolated in `preloader.config.ts` so wiring in the real asset is a contained change.
- Both respect `prefers-reduced-motion: reduce`.

**Open item:** preloader animation asset (format TBD — Lottie / video / SVG — determines if an extra dependency like `lottie-react` is needed). Blocks final wiring, not overall repo scaffolding.

## 7. SEO defaults (built into repo from day one)

- `app/sitemap.ts` — every page × every locale, with `hreflang` alternates generated from the same source as canonical/alternate metadata (no drift).
- `app/robots.ts` — allow-all in production, disallow-all on preview deployments (gated by `VERCEL_ENV`).
- `lib/seo.ts` — shared `generateMetadata` helper: canonical URL, hreflang alternates, OpenGraph/Twitter defaults, JSON-LD builders (`Organization`, `BreadcrumbList`, `Service`).
- `<html lang={locale}>` set dynamically per locale.
- Fully static generation as the performance baseline for Core Web Vitals.

## 8. Repo structure (reference)

See discussion log / repeat on request — full annotated tree covers:
`app/[locale]/...` routes, `middleware.ts`, `components/{cta,contact-form,layout,seo,ui,transitions,preloader}/`, `content/{locales.json,countries.json,<locale>/...}`, `lib/{seo,theme,locale,content,motion,env}.ts`, `styles/{tokens.css,themes/}`.

## 9. Open decisions

- [x] Styling approach — plain CSS Modules + `styles/tokens.css`
- [x] en-US scaffolding — `app/[locale]/...` structure in place, only `en-US` enabled in `content/locales.json`; adding a locale is a content + config change, not a restructuring
- [ ] Launch locale list beyond en-US — **priority: zh-CN** (translated content + OG image outstanding)
- [ ] Preloader asset (format + file) — user to provide; motion/preloader wiring not yet implemented
- [ ] Animation library final confirmation (Framer Motion is installed per the stack table but not yet used — no page transitions or preloader wired in this pass)
- [ ] Contact form delivery integration (email/CRM) — validation and success/error states work end-to-end; `components/contact-form/actions.ts` currently only logs submissions server-side

## 10. Explicitly out of scope (for now)

- Client project portfolio / case study pages
- User accounts / auth
- E-commerce / payments
- CMS integration (content is file-based JSON at launch)
