# Landing pages

Lead magnets and traffic pages. `(landing-pages)` is a Next.js route group: the
folder organises the code and adds **nothing to the URL**, so
`(landing-pages)/free-brand-audit/` is served at `/{locale}/free-brand-audit`.

Unlike core pages, a landing page exists only in the locales you choose. Every
other locale 404s, and hreflang / sitemap cover only the locales that have it.

Landing pages have their own header and footer (`layout.tsx` here, components in
`components/landing/`) — not the marketing site's, which lives in the sibling
`(site)` group. **Nothing on the site links to a landing page**: they're reached
from search results and campaigns only, and discovered through the sitemap. Don't
add one to nav, the footer or any listing.

## Add a page

1. Copy `_template/` to `<slug>/` (`_`-prefixed folders are private, never routed).
2. Set `SLUG` in the new `page.tsx` and edit `copy.ts`.
3. Run the copy through `docs/brand-voice.md` (voice + target search phrase), then pass the thin-content check below.
   Give the lead-form section `id="quote"`: the header button scrolls to it.
4. Register it in `lib/landing-pages.ts`:
   `{ slug: "free-brand-audit", locales: ["en-US"], indexable: true }`

## Demand check (required before a new page, or a new locale on a page)

Before writing copy, confirm people search for the phrase **in that market and language**: Search Console or keyword-tool volumes, else SERP proxies. Roughly 50+ combined monthly searches for the primary phrase and its close variants = worth building. Under that, or no evidence, warn and don't build (or build `indexable: false`, or wait for data from the live pages). Note the verdict and evidence at the top of the page's `copy.ts`. Full rule in `CLAUDE.md`.

## Thin-content check (required for every new or edited page)

Landing pages have no internal links, so they rank on their own content. Before
registering, confirm all of these — if one fails, fix it or use `indexable: false`:

- [ ] ≥ 300 words of unique visible body copy, plus a section beyond hero + CTA
- [ ] One distinct search intent; not a keyword/city/industry swap of another page
- [ ] < ~60% shared body copy with any other landing or core page
- [ ] `metaTitle`, `metaDescription` and H1 are unique across the site
- [ ] The offer is described concretely (what, format, next step); no filler
- [ ] Each listed locale has its own copy or is a deliberate same-language fallback
- [ ] Exactly one `<h1>`, logical headings, working CTA

The same rule is in the repo `CLAUDE.md`, so Claude runs it whenever it creates one.

## Service landing pages (shared design)

Pages that follow the standard layout (hero, approach marquee, what you get, team fit, case studies, FAQ, quote form) don't copy `_template/`: they render `components/landing/ServiceLanding.tsx` with their own `copy.ts` (type `ServiceLandingCopy`). See `figma-design-system-agency-india/` and `saas-ui-design-agency-india/`. Colors and layout live in `ServiceLanding.module.css`, so a design change applies to all of them at once.

## Regions

- **US only:** `locales: ["en-US"]`. `/en-GB/free-brand-audit` 404s.
- **Also UK:** add `"en-GB"` to `locales`. It inherits US copy unless `copy.ts`
  has an `en-GB` entry — add one only where wording or currency differs.
- **Different offer per region:** duplicate the folder under a new slug rather
  than branching inside one page.

## SEO

- `indexable: false` → `noindex` and no sitemap entry. Use it for paid-traffic
  pages that would only duplicate an indexable page.
- Slugs can't reuse a core route (`services`, `about`, …); `lib/landing-pages.ts`
  throws at load if they do.

## Optional fields on service landing pages

- `caseStudies`: leave it out until there is real work; the section only renders when it has items.
- `related`: link to the matching service page (`href` is a path without the locale, e.g. `/services/saas-design`). Landing pages still receive no links, but they may link out to their hub.
- The hero ends with a button to `#quote`, using the site's localized CTA label (`nav.cta.label`).
- Method and brief template: `docs/landing-page-method.md`.
