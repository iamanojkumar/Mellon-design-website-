import type { ServiceLandingCopy } from "@/components/landing/ServiceLanding";

/**
 * Written to docs/brand-voice.md, en-CA (Canadian spelling: colour, centre).
 * Target phrase: "web design company Toronto" (variants: web design toronto, web design agency toronto,
 * website design toronto).
 * DEMAND VERDICT (2026-10-02): INDICATIVE, NOT CONFIRMED. Source is the batch 2 Keyword Planner export
 * (36 agencies, location unconfirmed, volumes are 50/500/5,000 bands that overstated by roughly an order of
 * magnitude against batch 1's exact figures). In that export "web design toronto", "web design company
 * toronto" and "web design agency toronto" all sit in the 5,000 band (two competitors each); "web design
 * vancouver" 5,000. Real volume is probably lower. No SERP check. Owner chose to build it anyway. Verify in
 * Search Console after launch.
 * INVENTED / UNVERIFIED: the steps, the expectations and the FAQ answers are drafted, not Mellon's own
 * wording. "Based in India" comes from the existing landing pages; "video calls and shared files" is assumed.
 * The prices in the cost FAQ are market-derived (docs/pricing.md, search summaries only): confirm before
 * relying on them. Case studies: add when Mellon has real work to show.
 */
export const copy: Record<string, ServiceLandingCopy> = {
  "en-CA": {
    serviceName: "Website design and build",
    serviceType: "Web design company",
    areaServed: "Canada",
    metaTitle: "Web design company in Toronto — Mellon",
    metaDescription: "Mellon designs and builds websites for Toronto businesses in Webflow, Framer, WordPress, or custom code: UX, UI, SEO foundations, launch. Get a quote.",
    headline: "A web design company for Toronto businesses.",
    summary: "Mellon designs and builds websites for Toronto businesses in Webflow, Framer, WordPress, or custom code, from the sitemap to launch. One team does the design and the build, so what you approve is what goes live.",
    approach: {
      heading: "How a website project runs.",
      intro: "We start with what your visitors came to do, then design and build the site around it.",
      steps: [
        { title: "Discovery", text: "We learn who visits, what they need to do, and what the site has to achieve for the business." },
        { title: "Structure", text: "We map the pages and the content each one needs, before any layout is drawn." },
        { title: "Design", text: "We design the key pages and templates in Figma and refine them with your feedback." },
        { title: "Build", text: "We build the site on the platform that suits how your team will edit it." },
        { title: "Launch", text: "We test on real devices, set up redirects and metadata, go live, and hand over documentation." },
      ],
    },
    included: {
      heading: "What a Toronto website project covers.",
      intro: "For a new site or a redesign, a project can include:",
      items: [
        { title: "Site structure and content planning", text: "A sitemap and a content plan for every page, agreed before design starts." },
        { title: "UX and UI design", text: "Layouts, templates, and reusable components for every key page, built for mobile and desktop." },
        { title: "The build", text: "A finished site in Webflow, Framer, WordPress, or custom code." },
        { title: "SEO foundations", text: "Clean structure, metadata, redirects, and fast pages, so the site is ready to be found." },
        { title: "Launch and handover", text: "Testing, go-live support, and documentation your team can follow." },
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
        { title: "Design and build together", text: "The people who make the design decisions also build the site, so nothing gets lost between the mockup and the launch." },
        { title: "A platform that fits your team", text: "We recommend Webflow, Framer, WordPress, or custom code after discovery, and explain why." },
        { title: "Found by search", text: "Structure, metadata, and speed are built in from the start, not added at the end." },
        { title: "A site you can run", text: "Handover documentation means your team can update the site without us." },
      ],
    },
    faq: {
      heading: "Frequently asked questions.",
      items: [
        { question: "Are you based in Toronto?", answer: "Mellon is a design agency based in India. We work with Toronto teams over video calls and shared files. Toronto is 9.5 to 10.5 hours behind India, depending on daylight saving, so we agree call times that work on both sides." },
        { question: "Which platform should we choose?", answer: "It depends on who edits the site and what it has to do. After discovery we recommend one and explain the trade-offs." },
        { question: "Can you redesign our current website?", answer: "Yes. We review what is there, keep what works, and redesign what holds visitors back. We also set up redirects so old addresses lead to the right new pages." },
        { question: "Will the website rank in search?", answer: "We build in the foundations: clean structure, metadata, fast pages, and redirects. Ongoing SEO is a separate service." },
        { question: "How long does a website project take?", answer: "It depends on the number of pages and templates and how quickly feedback comes back. We give you a timeline with the proposal." },
        { question: "How much does a website cost in Toronto?", answer: "A simple brochure site starts from about C$2,700. A custom small-business site with SEO foundations typically falls between C$6,750 and C$18,000. We fix the price after a short call." },
      ],
    },
    quote: {
      heading: "Get a quote.",
      text: "Tell us about your business and the site you need. We'll scope a fixed fee or a monthly retainer with you and reply within one business day.",
    },
  },
};
