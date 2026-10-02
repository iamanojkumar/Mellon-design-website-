# Mellon brand voice

Derived from the existing en-US copy (`content/en-US/`: home, about, services, contact, `site.json`). It describes how the site already sounds, so new pages match it. Update it when the voice deliberately changes.

## The voice in one line

A small, senior studio talking plainly to a busy peer: confident, specific, a little dry, never salesy.

## What the existing copy does

- **Says the specific thing.** "Component libraries in Figma, mirrored in code", not "world-class solutions". Deliverables, tools and industries are named.
- **Short declaratives, often fragments.** "Twelve disciplines. One studio." "Start with a conversation."
- **Points at the agency cliché and steps around it.** "A conversation, not a proposal template." "Not a set of files thrown over a wall." "Without re-litigating the same button." One wry line per page is the ceiling.
- **Honest about fit.** "We'll tell you plainly whether we're the right studio." No claim that can't be backed.
- **"We" for the studio, "you/your team" for the reader.** Never "Agencies do X" or "the client".
- **Sentence-case headings, ending in a period** when they are a statement: "Tell us what you're building." Labels/eyebrows are short nouns ("Selected work").
- **Em dashes for asides**, US spelling on en-US (`color`, `organization`), numerals spelled out when small ("Twelve", "Sixteen").
- **Outcome over process.** Every claim ends in what the reader gets: consistency, speed, no lost intent between design and build.
- **CTAs:** "Start a project" is the standard label. Form/quote flows can say "Send message".

## Avoid

- Superlatives and unverifiable claims: "best", "world-class", "leading", "glorious success".
- Filler maxims: "Communication is the key", "Efficiency is the way to go".
- Vague authority: "We follow global standards" (which ones?).
- Third person about ourselves ("Agencies collaborate…"), Title Case headings, exclamation marks, buzzwords (synergy, cutting-edge, seamless, holistic).
- Sentences that say nothing without the company name swapped in. Test: could a competitor paste it unchanged?

## Copy review checklist (run on every page the team supplies)

1. Does every claim name something specific (deliverable, tool, outcome) or get cut?
2. First-person plural for us, second person for the reader; no third-person "agencies".
3. Sentence-case headings; statements end in a period.
4. No superlatives or clichés from the avoid list.
5. Facts agree with the rest of the site (counts of services/industries, response time, tools).
6. Includes the page's target search phrase naturally in title, H1, first paragraph and at least one H2, without stuffing.
7. Reads cleanly aloud in the target locale's spelling.

## Known inconsistencies in existing copy (open)

- **Industry count:** `home.json` says "a dozen industries besides"; `about.json` says "Sixteen industries". Pick one.
- **Two company descriptions:** `org.shortDescription` (brand, product, design systems) vs `org.description` ("UI/UX and product design agency specializing in SaaS, web, mobile…"). They lead with different things, so JSON-LD and meta can disagree.
- **Slogan:** `org.slogan` ("Redefining Experience for a Smarter and Responsible Future.") is the one line in buzzword register; nothing else on the site sounds like it. Not surfaced in the UI today.
- **Meta title formats differ:** home is `Mellon — …`; every other page is `… — Mellon`.
- **CTA labels:** "Start a project" everywhere except where the copy drifts to "Contact us" or "Get Your Quote" — use the standard label unless the context is a form.
- **Unverified specifics on the SaaS UI landing page** (`saas-ui-design-agency-india/copy.ts`): "six to twelve weeks", "one to two weekly syncs", "RICE", "VS Code", and "reply within one business day". Confirm each is true before more pages reuse them. The dashboard page reuses only the response time and the Figma handoff.
- **Landing-page CTA label:** the hero button now uses `nav.cta.label` ("Start a project") on landing pages, so the page matches the header button; the form heading still says "Get a quote."
- **Naming and packaging removed (2026-10-02):** the owner does not offer brand naming or packaging design. They were removed from the Branding service, the Bangalore branding landing page and the Consumer Electronics industry. Don't reintroduce them.
- **New-market landing pages (Dubai, Toronto, Singapore, Australia):** the cost FAQs publish local-currency price bands from the owner's market research. Confirm before leaving them live, and check whether UAE VAT, Singapore GST and Australian GST are included. "Based in India" and "video calls and shared files" are assumed, as on the Bangalore pages.
- **Spelling per market:** en-AE, en-SG, en-AU use British spelling; en-CA uses Canadian (colour, centre); the Paid Advertising copy is written once in US spelling and inherited, so it has no spelling differences to fix.
