import type { ServiceLandingCopy } from "@/components/landing/ServiceLanding";

/**
 * Written to docs/brand-voice.md, en-SG (British spelling).
 * Target phrase: "branding agency Singapore" (variants: branding singapore, branding company singapore,
 * brand consultancy singapore).
 * DEMAND VERDICT (2026-10-02): INDICATIVE, NOT CONFIRMED. Source is the batch 2 Keyword Planner export
 * (36 agencies, location unconfirmed, volumes are 50/500/5,000 bands that overstated by roughly an order of
 * magnitude against batch 1's exact figures). In that export "branding singapore" sits in the 5,000 band
 * (three competitors); "branding agency singapore" 500 (five competitors), "branding company singapore" 500,
 * "brand consultancy singapore" 500. Real volume is probably lower. No SERP check. Owner chose to build it
 * anyway. Verify in Search Console after launch.
 * INVENTED / UNVERIFIED: the steps, the expectations and the FAQ answers are drafted, not Mellon's own
 * wording. "Based in India" comes from the existing landing pages; "video calls and shared files" is assumed.
 * The prices in the cost FAQ are market-derived (docs/pricing.md, search summaries only): confirm before
 * relying on them. The Enterprise Development Grant was deliberately left out (unverified). Case studies:
 * add when Mellon has real work to show.
 */
export const copy: Record<string, ServiceLandingCopy> = {
  "en-SG": {
    serviceName: "Brand identity design",
    serviceType: "Branding agency",
    areaServed: "Singapore",
    metaTitle: "Branding agency in Singapore — Mellon",
    metaDescription: "Mellon is a branding agency for Singapore businesses: brand strategy, logo and visual identity, a brand manual, and a corporate presentation. Get a quote.",
    headline: "A branding agency for Singapore businesses.",
    summary: "Mellon builds brand identities for Singapore businesses, from strategy to logo, colour, and a brand manual, plus the corporate presentation that puts the brand in front of clients and partners.",
    approach: {
      heading: "How we build a brand in Singapore.",
      intro: "Whether you are launching or growing beyond the first version of your brand, we work from what the business needs the brand to do.",
      steps: [
        { title: "Understand", text: "We learn your business, your customers, and your competitors, and agree what the brand must achieve and where it will be seen." },
        { title: "Define", text: "We set the positioning and voice, so every later design decision has something to be checked against." },
        { title: "Design", text: "We create the logo, colour, typography, and imagery as a single identity and try it on real materials." },
        { title: "Write it down", text: "We produce a brand manual that explains how to apply the identity, for your team and for any agency you work with later." },
        { title: "Put it to work", text: "We build the corporate presentation from the identity and apply it to your first touchpoints." },
      ],
    },
    included: {
      heading: "What a branding project covers.",
      intro: "A project can include:",
      items: [
        { title: "Positioning and brand strategy", text: "A clear statement of what the brand stands for and who it speaks to." },
        { title: "Visual identity", text: "Logo, colour, typography, and imagery designed to work together." },
        { title: "Brand manual", text: "Rules and examples for using the identity consistently." },
        { title: "Corporate presentation", text: "A branded deck for clients, partners, and investors." },
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
        { title: "A reason behind every choice", text: "Each design decision traces back to the positioning we agreed at the start." },
        { title: "An identity that scales", text: "The system is built to extend to new products, channels, and markets without a redesign." },
        { title: "Documentation, not guesswork", text: "The brand manual lets your team apply the brand correctly on their own." },
        { title: "Workable hours", text: "Singapore is 2.5 hours ahead of India, so we can agree call times inside both working days." },
      ],
    },
    faq: {
      heading: "Frequently asked questions.",
      items: [
        { question: "Are you based in Singapore?", answer: "Mellon is a design agency based in India. We work with Singapore teams over video calls and shared files." },
        { question: "What is the difference between a logo and a brand?", answer: "A logo is a single mark. A brand is the full picture: the identity system, the voice, and the way the business shows up everywhere a customer meets it." },
        { question: "We're a startup. Is a full brand project too much?", answer: "Not necessarily. A focused identity, with a logo, visual identity, and brand manual, covers what an early business needs, and it can be extended later." },
        { question: "Can you refresh a brand we already have?", answer: "Yes. We start with what is working in the current brand, then decide what to keep, what to improve, and what to replace." },
        { question: "What will we have at the end?", answer: "The identity system and the brand manual, and a corporate presentation if you asked for one." },
        { question: "How much does branding cost in Singapore?", answer: "A focused identity with a brand manual typically falls between S$4,500 and S$13,500. A full strategy-led project runs higher, up to about S$54,000. We fix the fee after a short call." },
      ],
    },
    quote: {
      heading: "Get a quote.",
      text: "Tell us about your business and what the brand has to do. We'll scope a fixed fee with you and reply within one business day.",
    },
  },
};
