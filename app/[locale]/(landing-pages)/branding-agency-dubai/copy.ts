import type { ServiceLandingCopy } from "@/components/landing/ServiceLanding";

/**
 * Written to docs/brand-voice.md, en-AE (British spelling).
 * Target phrase: "branding agency Dubai" (variants: branding companies in dubai, top branding agency in dubai,
 * branding agency uae, branding company dubai).
 * DEMAND VERDICT (2026-10-02): INDICATIVE, NOT CONFIRMED. Source is the batch 2 Keyword Planner export
 * (36 agencies, location unconfirmed, volumes are 50/500/5,000 bands that overstated by roughly an order of
 * magnitude against batch 1's exact figures). In that export "branding companies in dubai" and "top branding
 * agency in dubai" sit in the 5,000 band with six competitors ranking, "logo design dubai" 5,000, "branding
 * agency dubai"-type phrases consistently at 500 to 5,000. Real volume is probably lower. No SERP check.
 * Owner chose to build it anyway. Verify in Search Console after launch.
 * INVENTED / UNVERIFIED: the steps, the four expectations and the FAQ answers are drafted, not Mellon's own
 * wording. "Based in India" comes from the existing landing pages; "video calls and shared files" is assumed.
 * The prices in the last FAQ are market-derived (docs/pricing.md, search summaries only): confirm before
 * relying on them. Arabic: the copy makes no promise; confirm what Mellon can actually deliver.
 * Case studies: add when Mellon has real work to show (the section renders only when `items` is filled).
 */
export const copy: Record<string, ServiceLandingCopy> = {
  "en-AE": {
    serviceName: "Brand identity design",
    serviceType: "Branding agency",
    areaServed: "United Arab Emirates",
    metaTitle: "Branding agency in Dubai — Mellon",
    metaDescription: "Mellon is a branding agency for Dubai businesses: brand strategy, logo and visual identity, a brand manual, and a corporate presentation. Get a quote.",
    headline: "A branding agency for Dubai businesses.",
    summary: "Mellon builds brand identities for Dubai businesses: strategy, logo and visual identity, a brand manual, and a corporate presentation, so the brand holds up from your website to your next pitch.",
    approach: {
      heading: "How a Dubai branding project runs.",
      intro: "We begin with where the business is going, then build the brand to match.",
      steps: [
        { title: "Brief", text: "We learn the business, its customers, and the markets it competes in, and agree what the brand has to achieve." },
        { title: "Position", text: "We settle the positioning and voice: what you stand for, who you're talking to, and how you differ from the alternatives." },
        { title: "Design", text: "We design the logo, colour, typography, and imagery as one system and test it on real applications." },
        { title: "Document", text: "We write the brand manual, so anyone who works on the brand later, in-house or at another agency, can apply it correctly." },
        { title: "Present", text: "We build the corporate presentation from the identity, so the first deck a client sees looks like the brand." },
      ],
    },
    included: {
      heading: "What a Dubai branding project covers.",
      intro: "A project can include:",
      items: [
        { title: "Brand strategy and positioning", text: "What the brand stands for, who it is for, and why someone should choose it." },
        { title: "Logo and visual identity", text: "The mark, colour, typography, and imagery, designed to work together on every surface." },
        { title: "Brand manual", text: "The rules for using the identity, written for your team and any agency you hire later." },
        { title: "Corporate presentation", text: "A deck in your brand for clients, partners, and investors, built from the identity." },
      ],
    },
    related: {
      text: "Want the full service?",
      label: "See our branding service.",
      href: "/services/branding",
    },
    partner: {
      heading: "What you can expect from us.",
      items: [
        { title: "Strategy before design", text: "We agree what the brand has to say before anyone draws a logo." },
        { title: "One system everywhere", text: "Colour, type, and imagery are designed together, so the brand looks the same on a website, a deck, and a sign." },
        { title: "A manual people use", text: "Guidance written for the people who apply the brand day to day, not just for the launch." },
        { title: "Straight talk on scope", text: "If the brand has to work in Arabic as well as English, tell us on the first call. It changes the scope, and we'll say plainly what we can cover." },
      ],
    },
    faq: {
      heading: "Frequently asked questions.",
      items: [
        { question: "Are you based in Dubai?", answer: "Mellon is a design agency based in India. We work with Dubai teams over video calls and shared files. Dubai is 1.5 hours behind India, so our working days overlap." },
        { question: "Why does a business need more than a logo?", answer: "A logo is one mark. The rest of the identity, colour, type, imagery, and tone, is what keeps the business recognisable when it appears on a website, a proposal, or a shopfront." },
        { question: "Can the brand work in Arabic and English?", answer: "Tell us at the start if you need both. A bilingual identity changes the scope, because type and layout have to work in two scripts, and we'll tell you plainly what we can deliver before you commit." },
        { question: "Can you rebrand an existing company?", answer: "Yes. We begin with what the current brand does well and where it holds you back, then decide what to keep and what to replace." },
        { question: "What do we receive at the end?", answer: "The identity system and brand manual, plus a corporate presentation if you asked for one, so your team can use the brand without us." },
        { question: "How much does branding cost in Dubai?", answer: "A focused identity, with a logo, colours, typefaces, and a short style sheet, starts from about AED 4,500. A full project with strategy, an identity system, and a brand manual typically falls between AED 13,500 and AED 36,000, with the corporate presentation quoted alongside. We fix the fee after a short call." },
      ],
    },
    quote: {
      heading: "Get a quote.",
      text: "Tell us about your business and what the brand has to do. We'll scope a fixed fee with you and reply within one business day.",
    },
  },
};
