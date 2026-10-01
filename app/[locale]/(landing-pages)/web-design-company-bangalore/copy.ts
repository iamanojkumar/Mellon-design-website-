import type { ServiceLandingCopy } from "@/components/landing/ServiceLanding";

/**
 * Written to docs/brand-voice.md, en-IN spelling.
 * Target phrase: "web design company Bangalore" (variants: web design bangalore, website design bangalore,
 * website design agency in bangalore).
 * DEMAND VERDICT (2026-10-01): CONFIRMED by keyword-tool volume. Keyword Planner export (12 competitors,
 * location unconfirmed): "web design bangalore" 1,900 a month, "website design bangalore" 1,900,
 * "website design agency in bangalore" 260. SERP not checked. Volumes are one competitor's export; verify
 * in Search Console after launch.
 * INVENTED / UNVERIFIED: the five steps, the four expectations and the FAQ answers are drafted, not Mellon's
 * own wording. "Based in India" and "reply within one business day" come from the existing landing pages;
 * "video calls and shared files" is assumed. Confirm whether to mention a Bangalore presence.
 */
export const copy: Record<string, ServiceLandingCopy> = {
  "en-IN": {
    serviceName: "Website design and build",
    serviceType: "Web design company",
    areaServed: "India",
    metaTitle: "Web design company in Bangalore — Mellon",
    metaDescription: "Mellon designs and builds websites for Bangalore businesses in Webflow, Framer, WordPress, or custom code: UX, UI, SEO basics, launch. Get a quote.",
    headline: "A web design company for Bangalore businesses.",
    summary: "Mellon designs and builds websites for Bangalore businesses, from the first sitemap to launch, so the people who design your site are the people who build it.",
    approach: {
      heading: "How we build a website.",
      intro: "We start with what your visitors need to do, then design and build around it.",
      steps: [
                { title: "Brief", text: "We agree who the site is for, the actions that matter most, and how you'll know it's working." },
                { title: "Sitemap", text: "We plan the pages and the content each one needs before anything is designed." },
                { title: "Design", text: "We design the key pages and templates in Figma and refine them with your feedback." },
                { title: "Build", text: "We build in Webflow, Framer, WordPress, or custom code, whichever suits how your team will edit the site." },
                { title: "Launch", text: "We test on real devices, set up redirects and metadata, go live, and hand over documentation." },
      ],
    },
    included: {
      heading: "What a website project covers.",
      intro: "Whether it's a new site or a redesign, a project can include:",
      items: [
                { title: "Website design", text: "Page layouts, templates, and components designed around your visitors' tasks." },
                { title: "The build", text: "A finished site in Webflow, Framer, WordPress, or custom code." },
                { title: "SEO foundations", text: "Clean structure, metadata, redirects, and fast pages, so the site is ready to be found." },
                { title: "Handover documentation", text: "Notes your team can follow to edit and extend the site without us." },
      ],
    },
    related: {
      text: "Want the full service?",
      label: "See our web design service.",
      href: "/services/web-design",
    },
    partner: {
      heading: "What you can expect from us.",
      items: [
                { title: "One team", text: "The people who design the site also build it, so nothing is lost between mockup and launch." },
                { title: "Clear scope", text: "We agree what's included up front, so you know what you're getting." },
                { title: "Plain communication", text: "We share progress in shared files and keep feedback rounds short." },
                { title: "A site you can run", text: "You get documentation so your team can update the site without us." },
      ],
    },
    faq: {
      heading: "Frequently asked questions.",
      items: [
                { question: "Are you based in Bangalore?", answer: "Mellon is a design agency based in India. We work with Bangalore teams over video calls and shared files." },
                { question: "Which platform should we use for our website?", answer: "It depends on who edits the site and what it has to do. We recommend one after the brief and explain why." },
                { question: "Can you redesign our existing website?", answer: "Yes. We keep what works, redesign what holds visitors back, and set up redirects so old URLs lead to the right new pages." },
                { question: "Will the site be optimized for search?", answer: "We build in the foundations: clean structure, metadata, fast pages, and redirects. Ongoing SEO is a separate service." },
                { question: "Do you build online stores too?", answer: "Yes, on Webflow and WooCommerce." },
                { question: "How do you price a website?", answer: "A clearly scoped site is a fixed project fee, and ongoing updates are a monthly retainer. We scope it with you after a short call." },
      ],
    },
    quote: {
      heading: "Get a quote.",
      text: "Tell us about your business and the site you need. We'll scope a fixed fee or a monthly retainer with you, and reply within one business day.",
    },
  },
};
