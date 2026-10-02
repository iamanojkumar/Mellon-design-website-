import type { ServiceLandingCopy } from "@/components/landing/ServiceLanding";

/**
 * Written to docs/brand-voice.md, en-IN spelling.
 * Target phrase: "branding agency Bangalore" (variants: bangalore branding agency, branding companies in
 * bangalore, branding in bangalore).
 * DEMAND VERDICT (2026-10-01): CONFIRMED by keyword-tool volume. Keyword Planner export (12 competitors,
 * location unconfirmed): "bangalore branding agency" 1,300 a month, "branding agency in bangalore" 1,300,
 * "branding companies in bangalore" 1,300 (one variant group, so about 1,300 combined, not 3,900),
 * "branding in bangalore" 170. SERP not checked; verify in Search Console after launch.
 * INVENTED / UNVERIFIED: the five steps, the four expectations and the FAQ answers are drafted, not Mellon's
 * own wording. "Based in India" and "reply within one business day" come from the existing landing pages;
 * "video calls and shared files" is assumed. Confirm whether to mention a Bangalore presence.
 */
export const copy: Record<string, ServiceLandingCopy> = {
  "en-IN": {
    serviceName: "Brand identity design",
    serviceType: "Branding agency",
    areaServed: "India",
    metaTitle: "Branding agency in Bangalore — Mellon",
    metaDescription: "Mellon is a branding agency for Bangalore businesses: brand strategy, logo and visual identity, a brand manual, and a corporate presentation. Get a quote.",
    headline: "A branding agency for Bangalore businesses.",
    summary: "Mellon builds brand identities for Bangalore businesses, from strategy to logo, colour, and a brand manual, so every touchpoint looks and sounds like one company.",
    approach: {
      heading: "How we build a brand.",
      intro: "We start with who you are and who you're talking to, then design the identity to carry that everywhere it appears.",
      steps: [
                { title: "Listen", text: "We learn your business, customers, and competitors, and agree what the brand has to say." },
                { title: "Position", text: "We define your positioning, your voice, and the idea behind the identity." },
                { title: "Create", text: "We design the logo, colour, typography, and imagery." },
                { title: "Test", text: "We try the identity on real applications, such as your website and social posts, before it's final." },
                { title: "Document", text: "We write guidelines so your team and other agencies can use the brand without us." },
      ],
    },
    included: {
      heading: "What a branding project covers.",
      intro: "A project can include:",
      items: [
                { title: "Brand strategy and positioning", text: "What the brand stands for, who it's for, and how it differs from the alternatives." },
                { title: "Corporate presentation", text: "A deck in your brand, built from the identity, for pitches and clients." },
                { title: "Logo and visual identity", text: "The mark, colour, typography, and imagery, designed as one system." },
                { title: "Brand manual", text: "Documentation your team and other agencies can work from." },
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
                { title: "Strategy first", text: "We settle what the brand stands for before anyone draws a logo." },
                { title: "One consistent system", text: "Colour, type, and imagery are designed to work together everywhere." },
                { title: "Guidelines that get used", text: "Documentation written for the people who will apply the brand every day." },
                { title: "Room to grow", text: "The identity is built to stretch across new products and channels." },
      ],
    },
    faq: {
      heading: "Frequently asked questions.",
      items: [
                { question: "Are you based in Bangalore?", answer: "Mellon is a design agency based in India. We work with Bangalore teams over video calls and shared files." },
                { question: "What's the difference between a logo and a brand identity?", answer: "A logo is one mark. An identity is the full system around it: colour, type, imagery, voice, and the rules for using them." },
                { question: "Do you make brand manuals and corporate presentations?", answer: "Yes. The brand manual documents the identity so any team can apply it. The corporate presentation puts the brand to work in a deck you can use for pitches, investors, or clients." },
                { question: "Can you rebrand an existing business?", answer: "Yes. We start with what the current brand does well and where it holds you back, then decide what to keep." },
                { question: "What do we receive at the end?", answer: "The identity system and brand manual your own team and other agencies can work from." },
                { question: "How do you price branding?", answer: "A clearly scoped project is a fixed fee, and ongoing brand support is a monthly retainer. We scope it with you after a short call." },
      ],
    },
    quote: {
      heading: "Get a quote.",
      text: "Tell us about your business and what the brand needs to do. We'll scope a fixed fee or a monthly retainer with you, and reply within one business day.",
    },
  },
};
