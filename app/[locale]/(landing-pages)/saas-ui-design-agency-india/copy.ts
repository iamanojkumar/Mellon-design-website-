import type { ServiceLandingCopy } from "@/components/landing/ServiceLanding";

/**
 * This page's copy, keyed by locale. A locale with no entry inherits along its
 * fallback chain, so only add an entry where the wording, currency or offer
 * differs from the locale it falls back to.
 *
 * Written to docs/brand-voice.md. Target phrase: "SaaS UI design agency India".
 */
export const copy: Record<string, ServiceLandingCopy> = {
  "en-US": {
    serviceName: "SaaS user interface design",
    serviceType: "SaaS UI design agency",
    areaServed: "United States",
    metaTitle: "SaaS UI design agency in India for US teams — Mellon",
    metaDescription:
      "Mellon is a design agency in India that designs SaaS user interfaces for US product teams: UX audit, roadmap, prototypes, and developer handoff. Get a quote.",
    headline: "A SaaS UI design agency in India for US product teams.",
    summary:
      "Mellon is a design agency based in India. We design SaaS interfaces around clear, easy navigation, so your users can complete key tasks and find value in the product faster.",
    approach: {
      heading: "How we design a SaaS interface.",
      intro:
        "We build a modular component library on top of a robust design system, so the interface stays visually consistent and ships quickly.",
      steps: [
        {
          title: "Problem",
          text: "We pair quantitative analytics, like drop-off heatmaps and session recordings, with qualitative feedback from usability tests and user surveys to pinpoint where users get stuck. Then we check the findings against UX heuristics and accessibility standards and rank issues by their impact on workflow completion and conversion.",
        },
        {
          title: "Audit",
          text: "We evaluate usability, design system consistency, accessibility, and your conversion funnels against industry heuristics. The result is a list of friction points, visual inconsistencies, and UX bottlenecks, each with an actionable recommendation for retention and workflow efficiency.",
        },
        {
          title: "Roadmap",
          text: "We weigh the high-impact user problems from the audit, analytics, and customer feedback against your business goals and engineering effort. Fixes and features are sequenced into a phased timeline using frameworks like RICE or impact versus effort, so users keep getting value while the product grows.",
        },
        {
          title: "Design",
          text: "We translate roadmap priorities into low-fidelity wireframes and user flows to test interactions early, then scale them into high-fidelity, component-driven designs. Interactive prototypes go through usability testing and are refined with design system tokens for a clean, accessible handoff.",
        },
        {
          title: "Execution",
          text: "We hand off through a shared component library and design tokens, so engineering builds what was designed without visual drift. After launch we watch product analytics, session replays, and feedback loops to measure success and keep refining.",
        },
      ],
    },
    included: {
      heading: "What you get.",
      intro:
        "Interfaces for products that get more complex the longer they succeed. Every engagement can include:",
      items: [
        {
          title: "Dashboards and data-dense UI",
          text: "Dashboards, tables, and reporting views that stay legible at scale.",
        },
        {
          title: "Onboarding and activation flows",
          text: "First-run and setup flows that get new users to their first result quickly.",
        },
        {
          title: "Settings, permissions, and admin",
          text: "The admin screens most SaaS products neglect, designed with the same care as the core product.",
        },
        {
          title: "Design system foundations",
          text: "A component library and tokens, so new features don't erode the whole.",
        },
      ],
    },
    partner: {
      heading: "How we work with your team.",
      items: [
        {
          title: "Aligned from the start",
          text: "We align product vision with business goals early, which prevents costly rework and keeps the UI tied to the user problem it's meant to solve.",
        },
        {
          title: "Efficient by design",
          text: "We keep feedback loops short and move quickly, so project time goes into refining the experience rather than waiting on administrative delays.",
        },
        {
          title: "Predictable delivery",
          text: "You get experienced UX designers and a scalable design system foundation, with a plan that stays on schedule and within budget.",
        },
        {
          title: "Launches that hit the window",
          text: "We scope tightly to avoid feature creep, so your product reaches its market window and you start collecting user feedback sooner.",
        },
      ],
    },
    caseStudies: {
      heading: "Case studies.",
      cta: "Request the case study",
      items: [{ name: "GetReplies" }, { name: "CogitX" }],
    },
    faq: {
      heading: "Frequently asked questions.",
      items: [
        {
          question: "Can a design agency in India work well with a US team?",
          answer:
            "Yes. Your team joins one to two weekly syncs for feedback, sign-offs, and domain knowledge, and we handle the execution. Everything happens in shared design files, so you can see progress at any point.",
        },
        {
          question: "How long does a SaaS UI redesign or initial build take?",
          answer:
            "Most end-to-end SaaS UI projects take six to twelve weeks, depending on product complexity, the state of your existing design system, and scope.",
        },
        {
          question: "How do you make sure the UI fits our product vision and business goals?",
          answer:
            "We start with a discovery phase and keep running audit reviews, so we can map user workflows directly to your conversion metrics and KPIs.",
        },
        {
          question: "How do you hand off to our engineers?",
          answer:
            "We deliver a documented design system, tokens, and component libraries in Figma, and work in VS Code or whichever tools your engineers prefer, so your team can implement the design pixel for pixel.",
        },
        {
          question: "How do you price SaaS UI design?",
          answer:
            "Clearly scoped work is a fixed project fee. Continuous product design is a recurring monthly retainer.",
        },
        {
          question: "How do you measure success after launch?",
          answer:
            "We track task completion rates, onboarding drop-offs, user retention, and customer feedback.",
        },
      ],
    },
    quote: {
      heading: "Get a quote.",
      text: "Tell us about your product and where the interface stands. We'll scope a fixed project fee or a monthly retainer with you, and reply within one business day.",
    },
  },
};
