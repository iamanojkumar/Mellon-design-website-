import type { ServiceLandingCopy } from "@/components/landing/ServiceLanding";

/**
 * Written to docs/brand-voice.md, en-AU (Australian spelling, same as British: colour, organisation).
 * Target phrase: "branding agency Australia" (variants: branding australia, branding melbourne,
 * branding agency sydney, branding agency melbourne).
 * DEMAND VERDICT (2026-10-02): INDICATIVE, NOT CONFIRMED. Source is the batch 2 Keyword Planner export
 * (36 agencies, location unconfirmed, volumes are 50/500/5,000 bands that overstated by roughly an order of
 * magnitude against batch 1's exact figures). In that export "branding australia" (three competitors) and
 * "branding melbourne" (four, also in batch 1) sit in the 5,000 band; "branding agency australia" and
 * "branding agency sydney" 500 with seven competitors each. Real volume is probably lower. No SERP check.
 * One country-level page rather than one per city, since the city variants share one intent. Owner chose to
 * build it anyway. Verify in Search Console after launch.
 * INVENTED / UNVERIFIED: the steps, the expectations and the FAQ answers are drafted, not Mellon's own
 * wording. "Based in India" comes from the existing landing pages; "video calls and shared files" is assumed.
 * The prices in the cost FAQ are market-derived (docs/pricing.md, search summaries only, GST treatment
 * unknown): confirm before relying on them. Case studies: add when Mellon has real work to show.
 */
export const copy: Record<string, ServiceLandingCopy> = {
  "en-AU": {
    serviceName: "Brand identity design",
    serviceType: "Branding agency",
    areaServed: "Australia",
    metaTitle: "Branding agency in Australia — Mellon",
    metaDescription: "Mellon is a branding agency for Australian businesses: brand strategy, logo and visual identity, a brand manual, and a corporate presentation. Get a quote.",
    headline: "A branding agency for Australian businesses.",
    summary: "Mellon builds brand identities for businesses in Sydney, Melbourne, Brisbane, Perth, and across Australia: strategy, logo and visual identity, a brand manual, and a corporate presentation.",
    approach: {
      heading: "How a branding project runs.",
      intro: "We work from the business outward: what it sells, who buys it, and where the brand has to show up.",
      steps: [
        { title: "Brief", text: "We learn the business and its customers, and agree the job the brand has to do." },
        { title: "Position", text: "We decide how the business should be positioned and how it should sound." },
        { title: "Create", text: "We design the logo, colour, typography, and imagery as one identity and check it on real applications." },
        { title: "Record", text: "We write the brand manual so anyone applying the brand, in-house or at another agency, gets it right." },
        { title: "Apply", text: "We build the corporate presentation and apply the identity to your first materials." },
      ],
    },
    included: {
      heading: "What a branding project covers.",
      intro: "A project can include:",
      items: [
        { title: "Brand strategy", text: "Positioning, voice, and the idea the identity is built on." },
        { title: "Logo and visual identity", text: "A mark, colour palette, typefaces, and imagery that work together." },
        { title: "Brand manual", text: "A document that sets out how the identity is used, with examples." },
        { title: "Corporate presentation", text: "A deck in your brand for clients, partners, and investors." },
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
        { title: "Strategy that shows up in the design", text: "The positioning we agree is the test every design choice has to pass." },
        { title: "One identity across every touchpoint", text: "From a website to a printed proposal, the brand reads as one business." },
        { title: "A manual your team can follow", text: "Plain instructions and examples, so the brand stays consistent as more people use it." },
        { title: "Planned around the time difference", text: "Sydney and Melbourne are 4.5 to 5.5 hours ahead of India, depending on daylight saving, so we agree call times that work for both sides." },
      ],
    },
    faq: {
      heading: "Frequently asked questions.",
      items: [
        { question: "Are you based in Australia?", answer: "Mellon is a design agency based in India. We work with Australian teams over video calls and shared files." },
        { question: "What is the difference between a logo and a brand identity?", answer: "A logo is one mark. A brand identity adds colour, type, imagery, voice, and the rules that keep them consistent." },
        { question: "Do you work with businesses outside Sydney and Melbourne?", answer: "Yes. The work happens over video calls and shared files, so your location does not change how we run the project." },
        { question: "Can you rebrand an existing business?", answer: "Yes. We begin with what the current brand does well and where it falls short, then decide what to keep." },
        { question: "What do we get at the end?", answer: "The identity system and the brand manual, plus a corporate presentation if you asked for one." },
        { question: "How much does branding cost in Australia?", answer: "A research-led identity typically falls between A$7,200 and A$18,000. A full project with strategy, identity, and a brand manual runs from about A$18,000 to A$45,000. We fix the fee after a short call." },
      ],
    },
    quote: {
      heading: "Get a quote.",
      text: "Tell us about your business and what the brand has to do. We'll scope a fixed fee with you and reply within one business day.",
    },
  },
};
