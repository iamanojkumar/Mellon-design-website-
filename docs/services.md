# Mellon services document

Living document. It is the single place that says what Mellon sells, which page serves each service, what people search for, and what it costs. Update it when a service is added, merged or dropped, or when new keyword research lands. `SCOPE.md` stays the source of truth for the site itself; this file is the source of truth for the offer.

Last updated 2026-10-01. Companion files: `docs/brand-voice.md`. Pricing and the raw keyword data are kept out of version control (local only).

## How to read the demand numbers

- Volumes are monthly searches from Google Keyword Planner exports of 12 competitors, collapsed so each variant group counts once. The export does not say which location it covers (bids are in INR), so volumes are **indicative and not proven per market**. Only phrases containing a city or country name carry real market evidence.
- "Agency-intent" phrases ("ui ux design agency") matter most, since the searcher is hiring. Head terms ("ui design", "logo design") are mostly learners and logo-seekers.
- This is competitor data, not Mellon's own. Search Console on the live pages overrides everything here once it exists.

## Service structure

Thirteen services as of 2026-10-01 (Web Design added), in four categories. The categories are the recommended organisation; `services.json` is still a flat list.

| Category | Service | Slug | Page type | Primary search phrase (monthly searches) | Verdict |
|---|---|---|---|---|---|
| **Brand** | Branding | `branding` | Core service page | "branding agency" 2,900; "logo design firms" 12,100; "bangalore branding agency" 1,300 | Keep. Strong, but head term "logo design" (135,000) is logo-seekers, not buyers. |
| **Product and UX** | UI/UX Design | `ui-ux-design` | Core service page | "ui ux design agency" 880; "ui ux design company" 480; "ui ux design agency india" 320; "ui ux companies in bangalore" 720 | Keep. Largest agency-intent cluster in the data. |
| | Product Design | `product-design` | Core service page | "product design studio" 110; "product design agency" 70; "product design" 12,100 (informational) | Keep, but small. Consider folding SaaS and Mobile App into it as sections if they stay thin. |
| | Mobile App Design | `mobile-app-design` | Core service page | "mobile app design companies" 9,900; "app design agency" 50; "mobile app ui ux design" 90 | Keep. One phrase carries the volume; verify before investing. |
| | SaaS Design | `saas-design` | Core service page + existing landing page | "saas ui design" 170; "saas design agency" 30; "dashboard user interface design" 2,900 | Keep, small. Already has a landing page. |
| | Design Systems | `design-systems` | Core service page + existing landing pages | "design system" 4,400 (mostly informational); "design system agency" 10 | Keep. Low agency-intent demand; value is positioning. Already has Figma landing pages (en-US, fr-FR). |
| | UX Audit | `ux-audit` | Core service page | "ux audit" 390; "ux audit services" 110 | Keep, small. Good entry offer to start a larger project. |
| **Web and commerce** | **Web Design (new)** | `web-design` | **New core service page** | "web design company" 5,400; "website design company" 5,400; "web design agency" 2,400; "web design company in india" 2,400; "web design bangalore" 1,900 | **Built 2026-10-01** at `/services/web-design` in all seven locales. Scope: design and build (Webflow, Framer, WordPress, custom code), as the About page already states. |
| | E-Commerce Design | `ecommerce-design` | Core service page | "web design e commerce" 2,400; "ecommerce agency" 880; "shopify website design company" 720; "ecommerce design agency" 20 | Keep. Consider making it a sub-section of Web Design if the page stays thin. |
| | End-to-End Design | `end-to-end-design` | Core service page | No search demand | **Reclassify** as an engagement model, not a service. Keep the page for people who land on it from the nav, but don't target keywords with it. |
| **Growth and content** | SEO and Content Strategy | `seo-content-strategy` | Core service page | "search engine optimizer services" 27,100; "seo search optimization" 90,500 (informational) | Keep as adjacent. Heavy competition (marketing agencies), only one competitor in the data ranks. Don't expand. |
| | Social Media and Content Marketing | `social-media-content-marketing` | Core service page | "social media agency" 2,900; "social media agency marketing" 6,600 | Adjacent, off-core. Keep as is; don't build landing pages. |
| | Motion and Interaction Design | `motion-interaction-design` | Core service page | "interaction design" 1,900; "motion in graphic design" 3,600 (informational); "motion design agency" 40 | Keep, small. Differentiator more than a traffic source. |

### Decisions taken (change them freely)

1. **Add Web Design as the thirteenth service**, as a core page. It is the one clear gap.
2. **Don't remove any service yet.** Several are tiny in search terms, but they describe what Mellon sells and rank as supporting pages. Revisit after the next keyword batch and Search Console data.
3. **Reclassify End-to-End Design** as an engagement model.
4. **Group the nav and services index by category.** Four categories keep thirteen items scannable.
5. **Don't chase generic marketing, graphic design, PR, advertising or web development keywords.** They're in `docs/keyword-research/parked_services.csv`.

## What each service page needs

Every service page gets the same sections. Empty sections stay in the template but don't render publicly until filled.

| Section | Status | Source |
|---|---|---|
| Hero: H1, one-line promise, CTA | Exists | Current copy |
| Summary and deliverables | Exists | `services.json` |
| Who it's for | To write | Mellon, from client work |
| Process and timeline | **Invented draft** on Web Design, UI/UX, Branding, Product and Mobile App | Needs Mellon's real process |
| Pricing and engagement models | Draft from `docs/pricing.md` | Owner decides what to publish |
| FAQ | **Invented draft** from search questions | Needs Mellon review |
| Related work | **Empty, owner will add** | Owner |
| Testimonials | **Empty, owner will add** | Owner (none invented) |
| Related industries | Exists | `services.json` |

## Engagement models (apply to every service)

| Model | Best for | Price basis |
|---|---|---|
| Fixed project | A defined scope | Project band per service and locale |
| Weekly engagement | A short sprint with a senior designer | Hourly × 20 h (derived) |
| Monthly retainer | Ongoing design with a fixed monthly budget | 40 h a month at a commitment discount (derived) |
| Monthly dedicated hire | A part-embedded designer | 120 h a month at a commitment discount (derived) |

Prices are internal and kept outside version control (this repo is public).

## Per-service notes

Keyword lists below show the phrases to use. Page briefs come in the next step.

### Web Design (new)
- **Primary:** web design company; secondary: web design agency, website design company, web design firms, web designing services.
- **India:** web design company in india (2,400), web design bangalore (1,900), hyderabad website designers.
- **Intent split:** buyers say "company/agency/firms"; learners say "web designing". Target the former.
- **Scope (settled):** design plus build. The About page says Mellon's development practice builds in Webflow, Framer, WordPress or custom code.
- **Locales:** en-US copy, inherited by en-GB and en-IN; own copy in de-DE, es-ES, fr-FR and nl-NL (drafted by me, needs a native read). Search phrases in those languages ("Webdesign-Agentur", "agencia de diseño web", "agence de web design", "webdesignbureau") were not volume-checked; the keyword data is English only.
- **Invented, to confirm:** the five process steps, six FAQ answers and the SEO-foundations deliverable. No timelines, prices or results are stated.
- **Competition:** high; the data shows 23–27 competition scores. A new page needs real depth to compete.

### UI/UX Design
- **Primary:** ui ux design agency (880); secondary: ui ux design company (480), ux design agency (260), ui ux design agency india (320), ui ux companies in bangalore (720).
- Surrounding informational cluster (ui ux, ui ux tools, ux principles, case studies) is large but belongs in articles, which the site doesn't have.

### Branding
- **Primary:** branding agency (2,900), branding agency bangalore (1,300), logo design firms (12,100), packaging design agency in india/mumbai.
- Avoid "logo design" as a primary; that audience wants a cheap logo.

### Product Design, Mobile App Design, SaaS Design, Design Systems, UX Audit, E-Commerce, Motion
- See the table above. All are small; they work as supporting pages and as targets for the existing landing pages.

### SEO and Content, Social Media (adjacent)
- Keep copy honest about scope: Mellon is a design studio. Don't expand these without a decision to enter marketing.

## Invented content (needs real information)

Everything below was written by me, not supplied by Mellon, and must be checked before publishing.

| Item | Where | What's needed |
|---|---|---|
| Weekly sprint, monthly retainer and monthly hire prices | `docs/pricing.md` | Derived from mid-market hourly rates with assumed hours (20 / 40 / 120) and a 12.5% commitment discount. Replace with your real rate card. |
| Engagement-model definitions (hours per week and month) | This file | Your actual packages. |
| Service structure and four categories | This file | Your call. |
| Process and timeline sections | To be written per page | Your real process and durations. I won't publish durations or step counts without them. |
| FAQ answers | To be written per page | I'll draft from the questions people search; you confirm each answer. |
| Testimonials, client names, results, case studies | Nowhere yet | **None invented.** Sections stay empty until you supply real ones, with permission to name the client. |
| Years in business, team size, client count | Nowhere yet | Not stated anywhere; don't add without facts. |

## Content architecture (decided 2026-10-01)

Service pages are **hubs**. Supporting guides (**spokes**) link up to their hub and across to siblings but are not in the nav. City and campaign pages stay as orphan landing pages. Full table and rules in `SCOPE.md` §12. Rollout: core pages, three Bangalore landing pages, spoke template, a five-spoke UI/UX pilot, then measure and scale.

## Change log

- 2026-10-01: document created from the keyword research. Added Web Design as a proposed service; proposed reclassifying End-to-End Design; proposed four categories.
- 2026-10-01: recorded the hub, spoke and landing-page architecture. Pricing rule clarified: internal only, never advertised. Started the SaaS dashboard landing page (see `docs/landing-page-method.md`).
- 2026-10-01: built the Web Design service (en-US, de-DE, es-ES, fr-FR, nl-NL; en-GB and en-IN inherit). Service pages gained optional process, FAQ (with FAQ markup), related-services sections and motion. Dashboard landing page set to indexable.
- 2026-10-01: reworked UI/UX Design, Branding, Product Design and Mobile App Design in all locales: search-focused H1, rewritten first paragraph, meta title and description (all within 160 characters), five-step process, six FAQs and four related services each.
- 2026-10-01: reworked the remaining eight services (Design Systems, E-Commerce, End-to-End, Motion, SaaS, SEO, Social, UX Audit) in all locales: process, FAQs, related services and meta. Search-focused H1 and summary on Design Systems, E-Commerce, Motion, SaaS and UX Audit; End-to-End, SEO and Social keep their existing H1 and summary because they are not keyword targets.
