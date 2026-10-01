import type { ServiceLandingCopy } from "@/components/landing/ServiceLanding";

/**
 * Written to docs/brand-voice.md, en-IN spelling.
 * Target phrase: "UI UX design company Bangalore" (variants: ui ux companies in bangalore, ui ux design
 * agency bangalore, ui ux design company in bangalore, ui ux design bangalore).
 * DEMAND VERDICT (2026-10-01): CONFIRMED by keyword-tool volume. Keyword Planner export (12 competitors,
 * location unconfirmed): "ui ux companies in bangalore" 720 a month, "ui ux design agency bangalore" 720,
 * "ui ux design company in bangalore" 720 (one variant group, so about 720 combined), "ui ux design
 * agency in bangalore" 170. Learner phrases (courses, jobs) are much larger and are NOT targeted.
 * SERP not checked; verify in Search Console after launch.
 * INVENTED / UNVERIFIED: the five steps, the four expectations and the FAQ answers are drafted, not Mellon's
 * own wording. "Based in India" and "reply within one business day" come from the existing landing pages;
 * "video calls and shared files" is assumed. Confirm whether to mention a Bangalore presence.
 */
export const copy: Record<string, ServiceLandingCopy> = {
  "en-IN": {
    serviceName: "UI/UX design",
    serviceType: "UI/UX design company",
    areaServed: "India",
    metaTitle: "UI/UX design company in Bangalore — Mellon",
    metaDescription: "Mellon is a UI/UX design company for Bangalore product teams: user research, flows, high-fidelity UI, and prototypes engineers can build from. Get a quote.",
    headline: "A UI/UX design company for Bangalore product teams.",
    summary: "Mellon designs the interfaces for Bangalore product teams: user research, flows, high-fidelity UI, and prototypes your engineers can build from.",
    approach: {
      heading: "How we design a product interface.",
      intro: "We design from what your users actually do, then test the design before your engineers build it.",
      steps: [
                { title: "Understand", text: "We talk to your users and look at how the product is used today, so the design starts from evidence." },
                { title: "Map", text: "We lay out the flows and screen structure in wireframes, and settle layout before visual design." },
                { title: "Design", text: "We design the screens in high fidelity, with one system of type, colour, and components." },
                { title: "Test", text: "We put interactive prototypes in front of real users and fix what they trip over." },
                { title: "Hand off", text: "We give your engineers annotated designs and a component library, then check the build against the design." },
      ],
    },
    included: {
      heading: "What a UI/UX project covers.",
      intro: "Depending on where your product is, a project can include:",
      items: [
                { title: "User research", text: "Interviews and usability tests that show what your users need and where they struggle." },
                { title: "Flows and wireframes", text: "The structure of the product, agreed before any visual design." },
                { title: "High-fidelity UI", text: "Finished screens for web and mobile, built from reusable components." },
                { title: "Prototypes and handoff", text: "Interactive prototypes for testing, and annotated files for engineers." },
      ],
    },
    related: {
      text: "Want the full service?",
      label: "See our UI/UX design service.",
      href: "/services/ui-ux-design",
    },
    partner: {
      heading: "What you can expect from us.",
      items: [
                { title: "Evidence over opinion", text: "Design decisions come from what users do, not from who argues loudest." },
                { title: "Built with your engineers", text: "We work in shared files and keep your engineers in the conversation." },
                { title: "Design that scales", text: "Components are documented so new screens match the rest of the product." },
                { title: "Honest scoping", text: "We agree what's in scope up front and tell you early if that changes." },
      ],
    },
    faq: {
      heading: "Frequently asked questions.",
      items: [
                { question: "Are you based in Bangalore?", answer: "Mellon is a design agency based in India. We work with Bangalore teams over video calls and shared files." },
                { question: "Do you do both UI and UX?", answer: "Yes. UX decides how the product works and UI decides how it looks and responds. Doing both keeps one team accountable for the result." },
                { question: "Can you work with our in-house team?", answer: "Yes. We hand off through shared files and a component library, and review the build against the design." },
                { question: "Can you redesign our existing product?", answer: "Yes. We review what's there, find where users struggle, and redesign those flows first." },
                { question: "What do we get at the end?", answer: "Annotated high-fidelity designs, an interactive prototype, and a component library in Figma, ready for your engineers." },
                { question: "How do you price UI/UX design?", answer: "A clearly scoped project is a fixed fee, and ongoing design is a monthly retainer. We scope it with you after a short call." },
      ],
    },
    quote: {
      heading: "Get a quote.",
      text: "Tell us about your product and where the interface stands. We'll scope a fixed fee or a monthly retainer with you, and reply within one business day.",
    },
  },
};
