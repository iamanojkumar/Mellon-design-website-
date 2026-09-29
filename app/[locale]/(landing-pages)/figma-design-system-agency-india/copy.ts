/**
 * This page's copy, keyed by locale. A locale with no entry inherits along its
 * fallback chain, so only add an entry where the wording, currency or offer
 * differs from the locale it falls back to.
 *
 * Written to docs/brand-voice.md. Target phrase: "Figma design system agency".
 */
import type { ServiceLandingCopy } from "@/components/landing/ServiceLanding";

export const copy: Record<string, ServiceLandingCopy> = {
  "en-US": {
    serviceName: "Figma design system design and development",
    serviceType: "Design system agency",
    metaTitle: "Figma design system agency in India for US teams — Mellon",
    metaDescription:
      "Mellon is a design agency in India that builds Figma design systems for US product teams: audit, tokens, code-synced components, and handover. Get a quote.",
    headline: "A Figma design system agency in India for US product teams.",
    summary:
      "Mellon is a design agency based in India. We build end-to-end design systems in Figma and mirror them in code, and we work with US teams through weekly syncs and shared libraries, so your designers and engineers stop rebuilding the same components and get back to the product.",
    approach: {
      heading: "How we build a design system.",
      intro: "Five steps, in order. Each one ends with something your team can review.",
      steps: [
        {
          title: "Problem",
          text: "We start by naming what's actually broken: inconsistent UI components, messy designer-to-developer handoffs, or user flows that fragment across your product.",
        },
        {
          title: "Audit",
          text: "We compare three things side by side: what your design system documents, what your Figma files contain, and what your product's code actually renders. The gaps become the brief.",
        },
        {
          title: "Roadmap",
          text: "We turn the audit into milestones and timelines tied to your goals, priorities, and scope, so you know what ships first and why.",
        },
        {
          title: "Design",
          text: "We standardize typography, color tokens, and spacing into one foundation, then build the components on top of it.",
        },
        {
          title: "Execution",
          text: "Components become reusable libraries that sync design tokens with your codebase. After launch we keep watching adoption rates and performance bugs, so the system gets used instead of shelved.",
        },
      ],
    },
    included: {
      heading: "What you get.",
      intro:
        "One governed system that design and engineering both build from. Every engagement includes:",
      items: [
        {
          title: "Token architecture",
          text: "Color, type, spacing, and motion tokens, defined once and shared between Figma and code.",
        },
        {
          title: "Component libraries",
          text: "Built in Figma and mirrored in code, in React, Angular, Vue, or native mobile.",
        },
        {
          title: "Documentation",
          text: "Usage guidance and contribution guidelines, so the system keeps its shape as your team grows.",
        },
        {
          title: "Rollout and adoption support",
          text: "Help moving existing products and teams onto the system, one section at a time.",
        },
      ],
    },
    partner: {
      heading: "How we work with your team.",
      items: [
        {
          title: "Clear communication",
          text: "Weekly alignment syncs and shared Figma libraries and GitHub repositories keep designers and engineers looking at the same thing.",
        },
        {
          title: "Efficiency built in",
          text: "One senior team runs the audit, the design, and the handoff, so nothing gets lost between phases.",
        },
        {
          title: "Support after launch",
          text: "We stay available after handover to answer questions and help your team maintain the system.",
        },
        {
          title: "Delivery that fits",
          text: "We scope each engagement to your product and stack, and deliver against what your team actually needs.",
        },
      ],
    },
    caseStudies: {
      heading: "Case studies.",
      cta: "Request the case study",
      items: [{ name: "GetReplies" }, { name: "Mellon" }, { name: "CogitX" }],
    },
    faq: {
      heading: "Frequently asked questions.",
      items: [
        {
          question: "Can a design agency in India work well with a US team?",
          answer:
            "Yes. We work through weekly alignment syncs, co-creation workshops, and shared Figma libraries and GitHub repositories, so your team sees progress and gives feedback throughout, not just at handover.",
        },
        {
          question: "Why hire an agency instead of building a design system in-house?",
          answer:
            "An agency brings specialized expertise and a dedicated team, so you can launch a foundational system months sooner without pulling your own designers and engineers off the product roadmap.",
        },
        {
          question: "How does the design system fit our existing tech stack?",
          answer:
            "We work with your engineering leads from the start, building components and design tokens that match your framework, whether that's React, Angular, Vue, or native mobile.",
        },
        {
          question: "Do we have to redesign our whole product to adopt a design system?",
          answer:
            "No. We roll a system out in stages, starting with low-risk pages or high-impact shared elements like navigation and buttons, then migrate legacy interfaces over time.",
        },
        {
          question: "How do you work with our design and engineering teams?",
          answer:
            "Through co-creation workshops, weekly alignment syncs, and shared Figma libraries and GitHub repositories, so handoffs stay smooth and both teams have a say.",
        },
        {
          question: "What happens after you finish building the system?",
          answer:
            "We hand it over properly: training workshops, governance guidelines, and documentation, so your team can maintain and grow the system without us.",
        },
        {
          question: "How do we know the design system is working?",
          answer:
            "We track component adoption across your codebase, time-to-market for new features, and the number of design-related QA bugs.",
        },
      ],
    },
    quote: {
      heading: "Get a quote.",
      text: "Pricing depends on the size of your product and the state of your current system, so we scope it with you. We've built design systems for startups and enterprise teams. Tell us where yours stands and we'll reply within one business day.",
    },
  },
};
