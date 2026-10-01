# Landing page content method

How landing page copy gets written, and why. The goal order is **traffic → engagement → conversion**: the page has to match what a searcher typed, keep them reading, then make asking for a quote the obvious next step.

## The method as it was (owner's prompts)

Five prompts, each about "a successful SaaS dashboard design":

1. Hero subtext: what clients consider a successful dashboard (under two sentences)
2. Approach subtext: an agency's approach (under two sentences)
3. Approach steps (each under two sentences)
4. Brand values: top four expected from a design agency (one sentence each)
5. FAQs: six, short answers

## What works

- The structure matches a buyer's questions in order: what good looks like, how you get there, who you are, what they'll ask.
- The length limits keep the hero and values scannable.
- Mapping each prompt to a section is repeatable, so pages come out consistent.

## What I'd change

| Issue | Why it matters | Fix |
|---|---|---|
| No target phrase in the prompts ("successful saas dashboard Design") | Nothing tells the writer what to rank for, and "successful" is vague | Start every brief with the primary phrase, plus 3–5 variants, and place it in title, H1, first paragraph and one H2 |
| Prompts ask a general AI what clients think | The output is the consensus every competitor already published; any agency could paste it unchanged | Feed in Mellon's real process, one real project, and the objections heard in sales calls, then edit the output against that |
| "Brand values expected from an agency" | These describe the buyer's wish list, not Mellon's behavior, so they can promise what Mellon doesn't deliver | Only publish a value Mellon can back with an example; phrase it as what the client gets |
| FAQs invented from imagination | They answer questions nobody asked | Source them from People Also Ask, sales emails and the questions on call; keep one for price and one for process |
| Answers can contain made-up specifics (timelines, tools, response times) | Unverifiable claims hurt trust and brand-voice rules ban them | State numbers only when they come from Mellon; otherwise say it's scoped per project |
| No funnel job per section | Pages inform but don't convert | Give every section one job (see below) and a CTA after the content that earns it |
| No proof | Nothing separates the page from competitors | Reserve a work section; show it only when real work exists (the layout now hides the section when empty) |
| No check for overlap with other pages | Near-duplicates trigger thin-content problems | Name the page's one intent and the page it must not duplicate |

## Funnel jobs per section

| Section | Job | Stage |
|---|---|---|
| Title, H1, summary | Match the search phrase and say what success looks like | Traffic |
| Approach steps | Show the thinking; hold attention | Engagement |
| What it covers | Make the offer concrete | Engagement |
| Related-service link | Give a next click that isn't the form | Engagement |
| Expectations (values) | Reduce risk of hiring | Conversion |
| Work (when it exists) | Prove it | Conversion |
| FAQ | Answer the last objections; earns FAQ rich results | Conversion |
| Quote form | One clear action | Conversion |

A button to the form sits in the hero; the quote section closes the page.

## Brief template (fill before writing)

1. Primary phrase and variants (with volume source)
2. Market, locale, language
3. Searcher intent and the one page it must not duplicate
4. Real inputs from Mellon: process, a project, three objections from buyers
5. Facts Mellon confirms (timelines, tools, prices); anything not confirmed gets left out
6. Proof available (work, quotes); anything missing stays empty

## Layout changes made with this method

- A hero button to the quote form (the page had no in-page button above the fold).
- An optional link from the page to its service page (`related` in `copy.ts`), so readers and search engines see the page's hub.
- The work section renders only when `caseStudies` has items.
