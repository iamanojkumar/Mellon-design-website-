import type { ServiceLandingCopy } from "@/components/landing/ServiceLanding";

/**
 * Written to docs/brand-voice.md. Target phrase: "SaaS dashboard design agency".
 *
 * DEMAND VERDICT (2026-10-01): LOW for the agency phrase. The owner was warned
 * and chose to index the page anyway; revisit with Search Console data.
 * - Keyword Planner export (12 competitors, location unconfirmed): "dashboard
 *   user interface design" 2,900 a month (one competitor; a learner phrase),
 *   "dashboard ui ux" 140, "ui ux dashboard" 140, "dashboard ui ux design" 70,
 *   "dashboard ux" 50. No volume at all for "saas dashboard design agency".
 * - SERP proxy: the buying phrase has a real commercial SERP (agency listicles
 *   from Eleken, Cieden, Onething and others), so the intent exists. Volume
 *   can't be seen from here.
 * - Overlap risk: /saas-ui-design-agency-india already lists dashboards as one
 *   deliverable. This page stays on dashboards only (data hierarchy, charts,
 *   role-based views); don't let the two converge.
 *
 * INVENTED / UNVERIFIED (owner to confirm): the five process steps and the
 * four expectations are drafted from how dashboard work generally goes, not
 * from Mellon's own process. "We reply within one business day" and the Figma
 * handoff are reused from the SaaS UI page. No timelines, prices or results
 * are stated. `caseStudies` is left out until there is real work to show.
 */
export const copy: Record<string, ServiceLandingCopy> = {
  "en-US": {
    serviceName: "SaaS dashboard design",
    serviceType: "SaaS dashboard design agency",
    areaServed: "United States",
    metaTitle: "SaaS dashboard design agency in India for US teams — Mellon",
    metaDescription:
      "Mellon designs SaaS dashboards for US product teams: data hierarchy, charts and tables, role-based views, and developer handoff. Get a quote.",
    headline: "A SaaS dashboard design agency in India for US product teams.",
    summary:
      "A successful SaaS dashboard lets your users see what matters, understand it at a glance, and act on it without hunting through the interface.",
    approach: {
      heading: "How we design a SaaS dashboard.",
      intro:
        "We design around the decisions your users make, then choose the data, charts, and layout that support each one.",
      steps: [
        {
          title: "Discovery",
          text: "We interview your users and review your analytics to learn which decisions the dashboard must support and which data they need first.",
        },
        {
          title: "Hierarchy",
          text: "We rank every metric by how often and how urgently users act on it, so the most important numbers sit where the eye lands first.",
        },
        {
          title: "Structure",
          text: "We map navigation, filters, and drill-downs into wireframes that take users from overview to detail in a few clicks.",
        },
        {
          title: "Visual design",
          text: "We pick the right chart or table for each dataset and build it as a reusable component with accessible color and contrast.",
        },
        {
          title: "Testing and handoff",
          text: "We test prototypes with real users, then give your engineers a documented component library and tokens so the build matches the design.",
        },
      ],
    },
    included: {
      heading: "What a dashboard engagement covers.",
      intro: "Dashboards break in the details. Every engagement can include:",
      items: [
        {
          title: "Overview and KPI views",
          text: "Summary screens that put the numbers your users check daily at the top, with clear status and trend.",
        },
        {
          title: "Charts, tables, and filters",
          text: "Data visualization and dense tables that stay readable, sortable, and filterable as your data grows.",
        },
        {
          title: "Role-based views",
          text: "Layouts that change by role, so an admin, an analyst, and an executive each see what they need.",
        },
        {
          title: "Empty, loading, and error states",
          text: "The states users meet most often, designed so the dashboard never looks broken.",
        },
      ],
    },
    related: {
      text: "Designing more than a dashboard?",
      label: "See our SaaS design service.",
      href: "/services/saas-design",
    },
    partner: {
      heading: "What you can expect from us.",
      items: [
        {
          title: "Clarity",
          text: "We make complex data easy to read, so your users get the point without effort.",
        },
        {
          title: "Collaboration",
          text: "We work as part of your product team, with your engineers and stakeholders involved from the start.",
        },
        {
          title: "Reliability",
          text: "We scope tightly, deliver what we agreed, and tell you early when something changes.",
        },
        {
          title: "Accountability",
          text: "We design for outcomes such as faster task completion and fewer support questions, and agree with you how to track them.",
        },
      ],
    },
    faq: {
      heading: "Frequently asked questions.",
      items: [
        {
          question: "What makes a SaaS dashboard design successful?",
          answer:
            "Users find the right number quickly, understand it without help, and know what to do next. We agree measures such as task completion and support questions before design starts.",
        },
        {
          question: "How do you work with a US team across time zones?",
          answer:
            "We schedule feedback sessions inside your working hours and keep everything in shared Figma files, so you can review progress at any point.",
        },
        {
          question: "Do you design the charts and data visualizations too?",
          answer:
            "Yes. We choose the chart type for each dataset and design it as a reusable component, including loading, empty, and error states.",
        },
        {
          question: "Can you redesign our existing dashboard without starting over?",
          answer:
            "Yes. We audit what's there, keep what works, and redesign the views that cause the most friction, so your users aren't relearning everything.",
        },
        {
          question: "How do you hand off to our engineers?",
          answer:
            "We deliver a documented component library and design tokens in Figma, with notes for each view, so your team can build what was designed.",
        },
        {
          question: "How do you price dashboard design?",
          answer:
            "Clearly scoped work is a fixed project fee, and ongoing work is a monthly retainer. We scope it with you after a short call.",
        },
      ],
    },
    quote: {
      heading: "Get a quote.",
      text: "Tell us about your product and which dashboards you need designed. We'll scope a fixed fee or a monthly retainer with you, and reply within one business day.",
    },
  },
};
