# Landing page rules (read by the admin assistant)

Distilled from `CLAUDE.md` for the landing page editor's AI chat. `CLAUDE.md` stays the source of truth; update this file when those rules change. The assistant also reads `docs/brand-voice.md`.

## Copy and voice

- Review every piece of copy against `docs/brand-voice.md` and rewrite it to match the voice and the page's target search phrase: title, description, H1, first paragraph and at least one H2.
- Flag anything that contradicts other pages.
- Never publish superlatives ("best", "leading", "world-class") or invented facts (results, prices, timelines, client names) that the user did not give. If a fact is needed and you do not have it, write `[Confirm: what is needed]` so the editor can fill it in.

## Thin-content rule

Landing pages get no internal links, so they rank on their own content. Near-duplicate pages funnelling to one offer risk doorway/thin-content penalties. Every page must pass:

1. **Substance:** an indexable page has at least 300 words of unique visible body copy (not counting header, footer or CTA labels) and at least one section beyond hero and CTA (what is included, who it is for, how it works, FAQ).
2. **Unique intent:** one search intent that no other landing or core page already serves. Never produce pages that differ only by a swapped keyword, city or industry name.
3. **Not a near-duplicate:** under about 60% shared body copy with any existing landing or core page.
4. **Unique metadata:** `metaTitle`, `metaDescription` and `headline` (H1) are distinct across the site and describe what the page actually offers.
5. **Real value:** the lead magnet or service is described concretely (what the visitor gets, format, what happens next). No placeholder, lorem or generic filler.
6. **Locales:** every locale served either has its own copy or is a deliberate same-language fallback.
7. **Structure:** exactly one H1, a logical heading order, and a working CTA (the quote form).

## Demand rule

Before writing, name the primary search phrase in the target language and market (do not translate the English phrase) and its close variants. Evidence, in order: the user's Search Console or keyword-tool volumes for that phrase and market (for example an uploaded keyword CSV); else search-result proxies. You cannot see search volumes yourself and must never invent numbers.

Give a verdict: **Demand confirmed** (roughly 50+ combined monthly searches for the primary phrase and close variants), **Low** (under that, or only a handful of queries) or **Unknown** (no evidence). For Low or Unknown, warn plainly and recommend not building it, or building it `indexable: false`. Record the verdict and evidence in the page's demand note (phrase, market, volumes from the file, verdict).

## Fields of a landing page

`metaTitle` (aim under 60 characters), `metaDescription` (under 155), `serviceName` and `serviceType` (schema.org Service), `areaServed` (country), `headline` (the H1), `summary` (first paragraph, includes the target phrase), `approach` (heading, intro, steps: title and text), `included` (heading, intro, items: title and text), `partner` (heading, items: title and text, the "why us / fit" section), optional `caseStudies` (only with real work), optional `related` link to the matching service page, `faq` (heading, items: question and answer), `quote` (heading and text above the lead form). The page also has a slug, a locale, an optional service slug and an indexable switch.
