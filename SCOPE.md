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

A "Projects" portfolio/case-study system is authored through a password-protected `/admin` tool
(see §11) — it is not part of the static-JSON content model and does not get its own public pages
yet (those are a later addition).

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
- Copy stays in git-versioned JSON for now. A CMS can replace the source later behind `lib/content.ts` (single seam); Supabase is used for contact submissions and, as of §11, for Projects — never for `site.json`/pages/services/industries copy.

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

- Public project/case-study pages (`/work` or similar) — the admin tool and data model exist
  (§11); the public-facing pages that list/link them are a later addition.
- User accounts / auth beyond the single-password `/admin` tool
- E-commerce / payments
- CMS integration for site copy (content is file-based JSON at launch; Projects are the one
  deliberate exception — see §11)

## 11. Projects (portfolio/case studies) — admin-authored, Supabase-backed

A deliberate, scoped exception to "static JSON only": editable through a password-protected
`/admin` tool (outside the `[locale]` route tree — `middleware.ts` passes `/admin*` through
without a locale redirect) so an editor can add/edit/delete case studies without a redeploy.

- **Auth**: a single hardcoded password, held only in the `ADMIN_PASSWORD` Vercel env var and
  compared server-side (`lib/admin-auth.ts`); a separate `ADMIN_SESSION_SECRET` signs the session
  cookie. Neither value, nor `SUPABASE_SERVICE_ROLE_KEY` / `DEEPSEEK_API_KEY`, is ever sent to the
  client — decoration-grade password, but properly concealed.
- **Storage**: a `projects` Supabase table (`supabase/migrations/20260927000000_projects.sql`,
  extended by `..._projects_v2.sql`) plus `project_folders`, read/written server-only via the
  service-role key (`lib/projects.ts`, `lib/folders.ts`), same pattern as `lib/submissions.ts` —
  no client-side anon-key access. Hero/content media lands in a public `project-media` Storage
  bucket, uploaded browser-direct: a server action mints a short-lived, path-scoped signed URL
  (`lib/upload-project-media.ts`) and the browser PUTs the file to Supabase itself. The bytes
  deliberately skip the server action — Vercel caps function request bodies at 4.5MB, so proxying
  them broke every real photo or video upload in production. The service-role key still never
  reaches the client; the 50MB cap and format allowlist are enforced on the bucket
  (`..._project_media_limits.sql`) because a signed URL holder can send arbitrary bytes.
- **Publish workflow**: every project is `draft`, `published` or `unpublished`; only `published`
  ever leaves the admin (`getPublishedProjects`). `published_at` is stamped by a database trigger
  the first time a row goes live, so the invariant holds for every write path (manual save, AI
  bulk create, duplicate-to-locale) and survives a later unpublish.
- **Folders**: per-locale groups (`project_folders`), full CRUD from the sidebar. Deleting a
  folder unfiles its projects (`on delete set null`) — it never deletes work. Folders are an
  editorial filing system only: they are **not** part of the URL, so projects can be reorganised
  without breaking links.
- **Hero image**: stored with alt text and intrinsic width/height. The dimensions are read off the
  image as it loads in the editor rather than typed, and feed both the public `<img>` (no layout
  shift) and an `ImageObject` in the structured data.
- **Slug history**: renaming a project pushes the old slug onto `previous_slugs` via a trigger, and
  `getProjectByPreviousSlug` lets the future public route redirect rather than 404 — so a rename
  never strands an indexed URL. Renaming a → b → a correctly drops `a` from the history.
- **SEO fields**: meta title and meta description (separate from the on-page title/summary, since
  a SERP title wants ~60 characters and a description ~160 — the panel counts against both),
  focus keyword, canonical URL, Open Graph title/description/image, a `noindex` switch for work
  that should stay live but out of the index, and a schema type — `CreativeWork` (default, the
  honest type for a case study), `Article` or `BlogPosting`. Every override falls back through to
  the on-page copy (`resolveSeo`), so an editor fills only what should differ.
  `buildMetadata` takes `ogType`/`twitterCard`/`noindex`, and `ogTypeForSchema` maps the schema
  type to `og:type` — editorial pieces get `article` + `summary_large_image` instead of the
  marketing pages' `website` + `summary`. `lib/project-seo.ts` generates the JSON-LD
  and references the same `#organization` node `lib/seo.ts` emits, so there is one organisation in
  the graph. Per Google's Article guidance no properties are strictly required; the generated
  graph covers the recommended set (headline, image, datePublished, dateModified, author,
  publisher). The admin previews the generated graph live and can replace it wholesale with a
  hand-written `json_ld_override`, which is validated as JSON before saving.
- **Content blocks** (`lib/project-blocks.ts`, `blocks` JSONB): an ordered list of designed
  sections sitting alongside the rich-text body — results/stats, testimonial, FAQ, image gallery,
  video. Block choice was made against Google's *current* docs, not assumption:
  - **Video** emits `VideoObject` — the only block here that still earns a rich result.
  - **FAQ** emits `FAQPage`, but Google restricted FAQ rich results to gov/health sites in
    Sept 2023 and **removed the feature entirely in May 2026**. Kept because other engines and
    answer systems still parse it; it wins nothing in Google. The editor says so on the block.
  - **Testimonial deliberately emits no `Review`/`AggregateRating`.** Google rules out star
    snippets where "the entity that's being reviewed controls the reviews about itself", so
    marking up our own client testimonials would be a guidelines risk with no upside.
  - Stats and gallery are design-only; gallery alt text feeds image search.
  Blocks contributing markup turn the JSON-LD into a `@graph`; with none, it stays a single node.
- **Custom head/body**: raw HTML injected into the eventual public page. Deliberately unsanitised
  — this is a single-operator tool behind a password, and the point is to paste tracking pixels
  and widget embeds. The same trust model covers the rich editor's Embed block. Anything added
  here runs on the public page, so it is only as safe as what the operator pastes.
- **AI assistant**: DeepSeek (`lib/ai-provider.ts`, the same `DEEPSEEK_API_KEY` as translation)
  via the AI SDK, streaming through `app/admin/api/chat/route.ts`. Its two tools —
  `proposeProject` and `proposeBulkProjects` — are declared **without** an `execute`, so the model
  can only ever propose: the call surfaces as a card in the chat panel and nothing reaches the
  database until the operator clicks Apply or Create. Bulk output always lands as drafts. Chat
  history is in-memory for the session only.
- **Note on AI SDK version**: pinned to the `ai` v6 line (`ai@6`, `@ai-sdk/react@3`,
  `@ai-sdk/openai-compatible@2`) because `ai@7` requires Node >= 22 and local dev runs Node 20.
  Revisit when the toolchain moves to Node 22+.
- **Publishing model**: Server Actions (`app/admin/actions.ts`) write via `lib/projects.ts` then
  call `revalidateTag(\`projects:${locale}\`)`, so once public pages are built they can read
  through cached, tagged `fetch` calls and get near-static performance with no-redeploy edits.
- **Category / service**: every project has a `category` (a `content/<locale>/industries.json`
  slug) and a `service` (a `content/<locale>/services.json` slug), chosen from dropdowns sourced
  from `getIndustries`/`getServices` — reusing this site's existing taxonomy rather than a new one.
- **Reusability**: the field vocabulary (`lib/project-fields.ts`), SEO builder, folder model and
  assistant are written against plain field shapes rather than `Project` itself, so a later
  content type (blog, resource) can reuse them. No second content type exists today — this is
  shape discipline, not unused abstraction.
- **Locale model — deliberately not the fallback/inheritance pattern used elsewhere**: each locale
  owns its own independent set of project rows (`projects.locale`), with no merge and no
  inheritance. The admin has a locale switcher to pick which locale's projects are being edited.
  A **"duplicate to locale"** action copies a project into another locale, machine-translating
  title/summary/content via the DeepSeek API (`lib/translate.ts`, `DEEPSEEK_API_KEY` — added by
  the site owner, not yet provisioned). Any future public page that lists or links projects must
  filter strictly by the visitor's locale and render its own "no projects yet" empty state when
  that locale has none — there is no fallback to another locale's projects.
