import type { ServiceLandingCopy } from "@/components/landing/ServiceLanding";

/**
 * This page's copy, keyed by locale. Every locale listed for the page in
 * lib/landing-pages.ts has its own entry here: the English ones are built from
 * one template with the market's name, country and spelling, and de/fr/es/nl
 * are full translations. Each names its market in the H1, title, summary, an
 * FAQ and the quote text, so the regional versions are not identical copies.
 *
 * Written to docs/brand-voice.md. Target phrase: "SaaS explainer video".
 * Variants: "product demo video", "premium product explainer video",
 * "AI explainer video" / "AI product video", "3D animated explainer video".
 *
 * Demand (2026-10-23): CONFIRMED for en-US. Owner's Google Keyword Planner
 * exports (11 files, Oct 2025 - Sep 2026, ~5,600 terms; INR account, target
 * location not recorded in the export) band "saas explainer video", "product
 * demo video", "ai explainer video", "ai product video", "explainer video
 * company" and "saas explainer" at 500/mo each; "saas product demo video",
 * "3d animated explainer video" and "explainer video agency" at 50/mo.
 * "premium product explainer video" has no measurable volume; it was added at
 * the owner's request. Banded volumes, so indicative only.
 *
 * Other locales (2026-10-23): demand rule OVERRIDDEN by the owner. No per-market
 * research was done for en-GB, en-AU, en-CA, en-IN, en-AE, en-SG, en-IE, de-DE,
 * fr-FR, es-ES or nl-NL; the slug and phrases are English in every locale.
 * Check Search Console per market and noindex or drop locales with no
 * impressions. Non-English markets may search for local phrases instead
 * (e.g. "Erklärvideo", "vidéo explicative", "vídeo explicativo").
 *
 * The film is Kryvex, a self-initiated concept (not a client), and is labeled
 * as such wherever it is described.
 */

const film = {
  poster: "/media/landing/saas-explainer-video/poster.jpg",
  sources: [
    { src: "/media/landing/saas-explainer-video/explainer-720.mp4", media: "(max-width: 900px)" },
    { src: "/media/landing/saas-explainer-video/explainer-1080.mp4" },
  ],
};

/** Chapter start times in seconds, shared by every language. */
const starts = [0, 4, 12, 19, 25];

type EnglishMarket = {
  /** Used before "teams", "companies", "buyers": "US", "UK", "Australian". */
  adjective: string;
  /** Used after "in": "the United States", "the UK", "Australia". */
  place: string;
  /** schema.org areaServed. */
  country: string;
  /** The English the scripts are written in. */
  english: string;
  spelling: "us" | "gb" | "ca";
  /** Replaces the default "Do you work with … companies?" answer. */
  workAnswer?: string;
};

const GB_SPELLING: [RegExp, string][] = [
  [/recognizes/g, "recognises"],
  [/colors/g, "colours"],
];
const CA_SPELLING: [RegExp, string][] = [[/colors/g, "colours"]];

function english(m: EnglishMarket): ServiceLandingCopy {
  const copy: ServiceLandingCopy = {
    serviceName: "SaaS explainer video and product demo video production",
    serviceType: "Explainer video production",
    areaServed: m.country,
    metaTitle: `SaaS explainer videos for ${m.adjective} AI teams in 3D - Mellon`,
    metaDescription: `Mellon makes premium product explainer videos and SaaS demo videos for ${m.adjective} AI and software teams: your real interface, a tight script, 3D.`,
    headline: `SaaS explainer videos for ${m.adjective} AI products, animated in 3D.`,
    summary: `We make SaaS explainer videos and premium product explainer videos for AI and software teams in ${m.place}. Your real interface, rebuilt and staged in 3D, with a script written in ${m.english}, so buyers see what the product does before they read a word.`,
    video: {
      heading: "A premium product explainer video, chapter by chapter.",
      intro:
        "Kryvex is a concept we made to show how we work: an AI engineer that traces an outage, writes the fix and proves it. The product is fictional. The script, interface and 3D work are ours.",
      title: "Kryvex product explainer video, a concept by Mellon",
      ...film,
      chaptersLabel: "Chapters",
      pause: "Pause video",
      play: "Play video",
      chapters: [
        { title: "Signal", text: "Twelve hundred alerts land as one incident." },
        { title: "Root cause", text: "The service map rises and the failing path turns red." },
        { title: "Fix", text: "The broken line shatters and the patch slides in." },
        { title: "Proof", text: "12,408 replayed requests flip from red to green." },
        { title: "Ship", text: "Checks pass, the canary reaches 100%, the chart climbs." },
      ].map((chapter, i) => ({ ...chapter, start: starts[i] })),
    },
    approach: {
      heading: "How we make a SaaS explainer video.",
      intro: "One story, told in short chapters, each showing one thing your product does.",
      steps: [
        {
          title: "Story",
          text: `We find the problem your buyer already recognizes and the moment your product solves it. The voice-over script is written in ${m.english} and timed to the film, so every line has a shot to land on.`,
        },
        {
          title: "Interface",
          text: "We rebuild your product's screens as a working web page with real copy and data, then capture them as stills and clips. Viewers see your interface, not a mock-up.",
        },
        {
          title: "Storyboard",
          text: "Each chapter gets its own camera and one job: the signal, the cause, the fix, the proof, the result. We mark the beats where the voice and music land.",
        },
        {
          title: "3D production",
          text: "We build the scenes in Blender: simulations, cloth, breaking objects and thousands of instanced shapes, all baked so any frame can be checked and re-rendered.",
        },
        {
          title: "Render and delivery",
          text: "We render a 1080p master from an image sequence, so a long render can resume where it stopped, then encode compressed versions for your website.",
        },
      ],
    },
    included: {
      heading: "What's in a product demo video.",
      intro: "Every film is built for the place it will play. A project can include:",
      items: [
        {
          title: "Script and voice-over script",
          text: "A script timed to the film, with pronunciation notes and sync points for the voice artist.",
        },
        {
          title: "Your product UI, rebuilt",
          text: "Screens recreated from your product with real states, so the film matches what customers will log in to.",
        },
        {
          title: "3D scenes you can adjust",
          text: "Blender scenes with a camera per chapter and effects exposed as settings, so a later change to copy or data doesn't mean starting over.",
        },
        {
          title: "Web-ready files",
          text: "A full-resolution master, smaller versions for phones and a poster frame, ready for your landing page.",
        },
      ],
    },
    partner: {
      heading: "Who it's for.",
      items: [
        {
          title: "AI products that are hard to show",
          text: "Agents and automations do their work out of sight. A film can show each step a screenshot can't: what it reads, what it decides, what it changes.",
        },
        {
          title: "SaaS launches",
          text: `A launch video for a new product or a major feature, built from the interface you're about to ship to ${m.adjective} customers.`,
        },
        {
          title: "Sales and first calls",
          text: "A short product demo video that explains the product before the first call, so the call can start with questions.",
        },
        {
          title: "Teams with a brand to keep",
          text: "We work from your interface, type and colors, so the film looks like your product rather than a template.",
        },
      ],
    },
    faq: {
      heading: "Frequently asked questions.",
      items: [
        {
          question: "What is a SaaS explainer video?",
          answer:
            "A short film that shows what a software product does, who it's for and why it matters, usually through the product's own interface. Ours are animated in 3D.",
        },
        {
          question: "How is a product demo video different from an explainer video?",
          answer:
            "An explainer tells the story of the problem and the outcome. A product demo video walks through the interface itself. We combine the two: each chapter is a real screen doing one job in the story.",
        },
        {
          question: "What makes a premium product explainer video?",
          answer:
            "Your own interface instead of stock screens, a script where every line has a shot, and 3D scenes lit and rendered frame by frame rather than assembled from a template.",
        },
        {
          question: "Can you make an explainer video for an AI product?",
          answer:
            "Yes. AI products suit 3D well, because the work an agent does is invisible in a screenshot. We stage each step it takes, so viewers can follow it.",
        },
        {
          question: `Do you work with ${m.adjective} companies?`,
          answer:
            m.workAnswer ??
            `Yes. We work with teams in ${m.place} remotely, over video calls and shared files. Scripts are written in ${m.english}, and the film uses your product's own copy.`,
        },
        {
          question: "Do you write the script?",
          answer:
            "Yes. The script comes first, and every line is tied to a shot and a time before any 3D work starts.",
        },
        {
          question: "Is Kryvex a real product?",
          answer:
            "No. Kryvex is a concept we made to show our process. Your film would use your own product, interface and brand.",
        },
        {
          question: "How much does an explainer video cost?",
          answer:
            "It's scoped per project: the length, the number of scenes and how much of your interface we rebuild set the price. We quote a fixed fee after a short call.",
        },
      ],
    },
    quote: {
      heading: "Get a quote.",
      text: `Tell us what your product does and where the video will play. We work with teams in ${m.place} over video calls and shared files, and quote a fixed fee once the film is scoped.`,
    },
  };
  const rules = m.spelling === "gb" ? GB_SPELLING : m.spelling === "ca" ? CA_SPELLING : [];
  if (rules.length === 0) return copy;
  let json = JSON.stringify(copy);
  for (const [pattern, replacement] of rules) json = json.replace(pattern, replacement);
  return JSON.parse(json) as ServiceLandingCopy;
}

export const copy: Record<string, ServiceLandingCopy> = {
  "en-US": english({
    adjective: "US",
    place: "the United States",
    country: "United States",
    english: "American English",
    spelling: "us",
  }),
  "en-GB": english({
    adjective: "UK",
    place: "the UK",
    country: "United Kingdom",
    english: "British English",
    spelling: "gb",
  }),
  "en-AU": english({
    adjective: "Australian",
    place: "Australia",
    country: "Australia",
    english: "Australian English",
    spelling: "gb",
  }),
  "en-CA": english({
    adjective: "Canadian",
    place: "Canada",
    country: "Canada",
    english: "Canadian English",
    spelling: "ca",
  }),
  "en-IN": english({
    adjective: "Indian",
    place: "India",
    country: "India",
    english: "Indian English",
    spelling: "gb",
    workAnswer:
      "Yes. We're a studio based in India, so we work with Indian teams over video calls and shared files. Scripts are written in Indian English, and the film uses your product's own copy.",
  }),
  "en-AE": english({
    adjective: "UAE",
    place: "the UAE",
    country: "United Arab Emirates",
    english: "British English",
    spelling: "gb",
  }),
  "en-SG": english({
    adjective: "Singapore",
    place: "Singapore",
    country: "Singapore",
    english: "British English",
    spelling: "gb",
  }),
  "en-IE": english({
    adjective: "Irish",
    place: "Ireland",
    country: "Ireland",
    english: "Irish English",
    spelling: "gb",
  }),

  "de-DE": {
    serviceName: "Produktion von SaaS-Erklärvideos und Produkt-Demovideos",
    serviceType: "Erklärvideo-Produktion",
    areaServed: "Germany",
    metaTitle: "SaaS-Erklärvideos für KI-Teams in Deutschland - Mellon",
    metaDescription:
      "Mellon produziert Premium-Produkt-Erklärvideos und SaaS-Demovideos für KI- und Software-Teams in Deutschland: Ihre echte Oberfläche, ein präzises Skript, 3D.",
    headline: "SaaS-Erklärvideos für KI-Produkte in Deutschland, in 3D animiert.",
    summary:
      "Wir produzieren SaaS-Erklärvideos und Premium-Produkt-Erklärvideos für KI- und Software-Teams in Deutschland. Ihre echte Oberfläche, nachgebaut und in 3D inszeniert, damit Käufer sehen, was das Produkt tut, bevor sie ein Wort lesen.",
    video: {
      heading: "Ein Premium-Produkt-Erklärvideo, Kapitel für Kapitel.",
      intro:
        "Kryvex ist ein Konzept, das wir entwickelt haben, um unsere Arbeitsweise zu zeigen: ein KI-Engineer, der einen Ausfall zurückverfolgt, den Fix schreibt und ihn belegt. Das Produkt ist fiktiv. Skript, Oberfläche und 3D-Arbeit stammen von uns.",
      title: "Kryvex Produkt-Erklärvideo, ein Konzept von Mellon",
      ...film,
      chaptersLabel: "Kapitel",
      pause: "Video pausieren",
      play: "Video abspielen",
      chapters: [
        { title: "Signal", text: "Zwölfhundert Alerts landen als ein einziger Incident." },
        { title: "Ursache", text: "Die Service-Map steigt auf, der fehlerhafte Pfad färbt sich rot." },
        { title: "Fix", text: "Die fehlerhafte Zeile zerspringt, der Patch gleitet hinein." },
        { title: "Beweis", text: "12.408 wiederholte Requests springen von Rot auf Grün." },
        { title: "Release", text: "Checks bestanden, der Canary erreicht 100 %, die Kurve steigt." },
      ].map((chapter, i) => ({ ...chapter, start: starts[i] })),
    },
    approach: {
      heading: "So entsteht ein SaaS-Erklärvideo.",
      intro: "Eine Geschichte in kurzen Kapiteln, jedes zeigt genau eine Sache, die Ihr Produkt tut.",
      steps: [
        {
          title: "Story",
          text: "Wir finden das Problem, das Ihre Käufer bereits kennen, und den Moment, in dem Ihr Produkt es löst. Das Sprecherskript ist auf den Film getimt, damit jede Zeile eine Einstellung hat, auf der sie landet.",
        },
        {
          title: "Oberfläche",
          text: "Wir bauen die Screens Ihres Produkts als funktionierende Webseite mit echten Texten und Daten nach und nehmen sie als Standbilder und Clips auf. Zuschauer sehen Ihre Oberfläche, kein Mock-up.",
        },
        {
          title: "Storyboard",
          text: "Jedes Kapitel bekommt eine eigene Kamera und eine Aufgabe: das Signal, die Ursache, der Fix, der Beweis, das Ergebnis. Wir markieren die Stellen, an denen Stimme und Musik einsetzen.",
        },
        {
          title: "3D-Produktion",
          text: "Wir bauen die Szenen in Blender: Simulationen, Stoff, zerbrechende Objekte und Tausende instanzierte Formen, alles vorberechnet, damit sich jeder Frame prüfen und neu rendern lässt.",
        },
        {
          title: "Rendering und Übergabe",
          text: "Wir rendern einen 1080p-Master aus einer Bildsequenz, sodass ein langer Render dort weitermacht, wo er stoppte, und kodieren komprimierte Versionen für Ihre Website.",
        },
      ],
    },
    included: {
      heading: "Was in einem Produkt-Demovideo steckt.",
      intro: "Jeder Film wird für den Ort gebaut, an dem er läuft. Ein Projekt kann enthalten:",
      items: [
        {
          title: "Skript und Sprecherskript",
          text: "Ein auf den Film getimtes Skript mit Aussprachehinweisen und Sync-Punkten für die Sprecherin oder den Sprecher.",
        },
        {
          title: "Ihre Produktoberfläche, nachgebaut",
          text: "Screens aus Ihrem Produkt mit echten Zuständen, damit der Film zeigt, was Kunden nach dem Login sehen.",
        },
        {
          title: "Anpassbare 3D-Szenen",
          text: "Blender-Szenen mit einer Kamera pro Kapitel und Effekten als Einstellungen, damit eine spätere Text- oder Datenänderung keinen Neuanfang bedeutet.",
        },
        {
          title: "Webfertige Dateien",
          text: "Ein Master in voller Auflösung, kleinere Versionen für Smartphones und ein Posterbild, bereit für Ihre Landingpage.",
        },
      ],
    },
    partner: {
      heading: "Für wen es gedacht ist.",
      items: [
        {
          title: "KI-Produkte, die schwer zu zeigen sind",
          text: "Agenten und Automatisierungen arbeiten im Verborgenen. Ein Film zeigt jeden Schritt, den ein Screenshot nicht zeigen kann: was er liest, was er entscheidet, was er ändert.",
        },
        {
          title: "SaaS-Launches",
          text: "Ein Launch-Video für ein neues Produkt oder ein großes Feature, gebaut aus der Oberfläche, die Sie gerade an Kunden in Deutschland ausliefern.",
        },
        {
          title: "Vertrieb und Erstgespräche",
          text: "Ein kurzes Produkt-Demovideo, das das Produkt vor dem ersten Call erklärt, damit der Call mit Fragen beginnen kann.",
        },
        {
          title: "Teams mit einer Marke",
          text: "Wir arbeiten mit Ihrer Oberfläche, Ihrer Typografie und Ihren Farben, damit der Film wie Ihr Produkt aussieht und nicht wie eine Vorlage.",
        },
      ],
    },
    faq: {
      heading: "Häufige Fragen.",
      items: [
        {
          question: "Was ist ein SaaS-Erklärvideo?",
          answer:
            "Ein kurzer Film, der zeigt, was ein Softwareprodukt tut, für wen es ist und warum es wichtig ist, meist über die eigene Oberfläche des Produkts. Unsere sind in 3D animiert.",
        },
        {
          question: "Was unterscheidet ein Produkt-Demovideo von einem Erklärvideo?",
          answer:
            "Ein Erklärvideo erzählt die Geschichte von Problem und Ergebnis. Ein Produkt-Demovideo führt durch die Oberfläche selbst. Wir verbinden beides: Jedes Kapitel ist ein echter Screen mit einer Aufgabe in der Geschichte.",
        },
        {
          question: "Was macht ein Premium-Produkt-Erklärvideo aus?",
          answer:
            "Ihre eigene Oberfläche statt Stock-Screens, ein Skript, in dem jede Zeile eine Einstellung hat, und 3D-Szenen, die Frame für Frame beleuchtet und gerendert werden, statt aus einer Vorlage zusammengesetzt zu sein.",
        },
        {
          question: "Können Sie ein Erklärvideo für ein KI-Produkt machen?",
          answer:
            "Ja. KI-Produkte eignen sich gut für 3D, weil die Arbeit eines Agenten auf einem Screenshot unsichtbar ist. Wir inszenieren jeden Schritt, damit Zuschauer ihm folgen können.",
        },
        {
          question: "Arbeiten Sie mit Unternehmen in Deutschland?",
          answer:
            "Ja. Wir arbeiten remote mit Teams in Deutschland, per Videocall und über gemeinsame Dateien, und der Film nutzt die Texte Ihres eigenen Produkts.",
        },
        {
          question: "Schreiben Sie das Skript?",
          answer:
            "Ja. Das Skript kommt zuerst, und jede Zeile ist an eine Einstellung und einen Zeitpunkt gebunden, bevor die 3D-Arbeit beginnt.",
        },
        {
          question: "Ist Kryvex ein echtes Produkt?",
          answer:
            "Nein. Kryvex ist ein Konzept, das wir entwickelt haben, um unseren Prozess zu zeigen. Ihr Film würde Ihr eigenes Produkt, Ihre Oberfläche und Ihre Marke zeigen.",
        },
        {
          question: "Was kostet ein Erklärvideo?",
          answer:
            "Das wird pro Projekt kalkuliert: Länge, Anzahl der Szenen und wie viel Ihrer Oberfläche wir nachbauen, bestimmen den Preis. Nach einem kurzen Gespräch nennen wir einen Festpreis.",
        },
      ],
    },
    quote: {
      heading: "Angebot anfordern.",
      text: "Erzählen Sie uns, was Ihr Produkt tut und wo das Video laufen soll. Wir arbeiten mit Teams in Deutschland per Videocall und gemeinsamen Dateien und nennen einen Festpreis, sobald der Film geplant ist.",
    },
  },

  "fr-FR": {
    serviceName: "Production de vidéos explicatives SaaS et de vidéos de démo produit",
    serviceType: "Production de vidéos explicatives",
    areaServed: "France",
    metaTitle: "Vidéos explicatives SaaS pour équipes IA en France - Mellon",
    metaDescription:
      "Mellon réalise des vidéos explicatives produit premium et des démos SaaS pour les équipes IA et logiciel en France : votre vraie interface, animée en 3D.",
    headline: "Des vidéos explicatives SaaS pour les produits IA en France, animées en 3D.",
    summary:
      "Nous réalisons des vidéos explicatives SaaS et des vidéos explicatives produit premium pour les équipes IA et logiciel en France. Votre vraie interface, reconstruite et mise en scène en 3D, pour que l'acheteur voie ce que fait le produit avant d'avoir lu un mot.",
    video: {
      heading: "Une vidéo explicative produit premium, chapitre par chapitre.",
      intro:
        "Kryvex est un concept que nous avons créé pour montrer notre méthode : un ingénieur IA qui remonte une panne, écrit le correctif et le prouve. Le produit est fictif. Le script, l'interface et le travail 3D sont les nôtres.",
      title: "Vidéo explicative produit Kryvex, un concept de Mellon",
      ...film,
      chaptersLabel: "Chapitres",
      pause: "Mettre la vidéo en pause",
      play: "Lire la vidéo",
      chapters: [
        { title: "Signal", text: "Mille deux cents alertes deviennent un seul incident." },
        { title: "Cause", text: "La carte des services s'élève, le chemin en échec passe au rouge." },
        { title: "Correctif", text: "La ligne défaillante se brise, le patch prend sa place." },
        { title: "Preuve", text: "12 408 requêtes rejouées passent du rouge au vert." },
        { title: "Mise en production", text: "Les tests passent, le canary atteint 100 %, la courbe grimpe." },
      ].map((chapter, i) => ({ ...chapter, start: starts[i] })),
    },
    approach: {
      heading: "Comment nous réalisons une vidéo explicative SaaS.",
      intro: "Une histoire en courts chapitres, chacun montrant une seule chose que fait votre produit.",
      steps: [
        {
          title: "Histoire",
          text: "Nous identifions le problème que votre acheteur connaît déjà et le moment où votre produit le résout. Le script de la voix off est calé sur le film, pour que chaque phrase tombe sur un plan.",
        },
        {
          title: "Interface",
          text: "Nous reconstruisons les écrans de votre produit sous forme de page web fonctionnelle, avec de vrais textes et de vraies données, puis nous les capturons en images et en clips. Le spectateur voit votre interface, pas une maquette.",
        },
        {
          title: "Storyboard",
          text: "Chaque chapitre a sa caméra et une seule mission : le signal, la cause, le correctif, la preuve, le résultat. Nous repérons les temps forts où la voix et la musique tombent.",
        },
        {
          title: "Production 3D",
          text: "Nous construisons les scènes dans Blender : simulations, tissus, objets qui se brisent et des milliers de formes instanciées, le tout précalculé pour que chaque image puisse être vérifiée et recalculée.",
        },
        {
          title: "Rendu et livraison",
          text: "Nous rendons un master 1080p à partir d'une séquence d'images, pour qu'un long rendu reprenne là où il s'est arrêté, puis nous encodons des versions compressées pour votre site.",
        },
      ],
    },
    included: {
      heading: "Ce que contient une vidéo de démo produit.",
      intro: "Chaque film est conçu pour l'endroit où il sera diffusé. Un projet peut inclure :",
      items: [
        {
          title: "Script et script de voix off",
          text: "Un script calé sur le film, avec des indications de prononciation et des points de synchronisation pour la voix.",
        },
        {
          title: "Votre interface, reconstruite",
          text: "Des écrans recréés à partir de votre produit, avec de vrais états, pour que le film corresponde à ce que vos clients verront une fois connectés.",
        },
        {
          title: "Des scènes 3D modifiables",
          text: "Des scènes Blender avec une caméra par chapitre et des effets réglables, pour qu'un changement de texte ou de données ne vous oblige pas à tout recommencer.",
        },
        {
          title: "Des fichiers prêts pour le web",
          text: "Un master en pleine résolution, des versions plus légères pour mobile et une image d'affiche, prêts pour votre landing page.",
        },
      ],
    },
    partner: {
      heading: "Pour qui.",
      items: [
        {
          title: "Les produits IA difficiles à montrer",
          text: "Les agents et les automatisations travaillent hors de vue. Un film montre chaque étape qu'une capture d'écran ne montre pas : ce qu'il lit, ce qu'il décide, ce qu'il modifie.",
        },
        {
          title: "Les lancements SaaS",
          text: "Une vidéo de lancement pour un nouveau produit ou une fonctionnalité majeure, construite à partir de l'interface que vous livrez à vos clients en France.",
        },
        {
          title: "Les ventes et les premiers rendez-vous",
          text: "Une courte vidéo de démo produit qui explique le produit avant le premier appel, pour que l'appel commence par les questions.",
        },
        {
          title: "Les équipes attachées à leur marque",
          text: "Nous partons de votre interface, de votre typographie et de vos couleurs, pour que le film ressemble à votre produit et non à un modèle.",
        },
      ],
    },
    faq: {
      heading: "Questions fréquentes.",
      items: [
        {
          question: "Qu'est-ce qu'une vidéo explicative SaaS ?",
          answer:
            "Un court film qui montre ce que fait un logiciel, à qui il s'adresse et pourquoi il compte, le plus souvent à travers sa propre interface. Les nôtres sont animées en 3D.",
        },
        {
          question: "Quelle différence entre une vidéo de démo produit et une vidéo explicative ?",
          answer:
            "La vidéo explicative raconte le problème et le résultat. La vidéo de démo produit parcourt l'interface elle-même. Nous combinons les deux : chaque chapitre est un vrai écran qui joue un rôle dans l'histoire.",
        },
        {
          question: "Qu'est-ce qui fait une vidéo explicative produit premium ?",
          answer:
            "Votre propre interface plutôt que des écrans génériques, un script où chaque phrase a son plan, et des scènes 3D éclairées et rendues image par image plutôt qu'assemblées à partir d'un modèle.",
        },
        {
          question: "Pouvez-vous réaliser une vidéo explicative pour un produit IA ?",
          answer:
            "Oui. Les produits IA se prêtent bien à la 3D, car le travail d'un agent est invisible sur une capture d'écran. Nous mettons en scène chaque étape pour que le spectateur puisse la suivre.",
        },
        {
          question: "Travaillez-vous avec des entreprises en France ?",
          answer:
            "Oui. Nous travaillons à distance avec des équipes en France, par visioconférence et fichiers partagés, et le film reprend les textes de votre propre produit.",
        },
        {
          question: "Écrivez-vous le script ?",
          answer:
            "Oui. Le script vient en premier, et chaque phrase est liée à un plan et à un timing avant le début du travail 3D.",
        },
        {
          question: "Kryvex est-il un vrai produit ?",
          answer:
            "Non. Kryvex est un concept que nous avons créé pour montrer notre méthode. Votre film utiliserait votre produit, votre interface et votre marque.",
        },
        {
          question: "Combien coûte une vidéo explicative ?",
          answer:
            "Le prix dépend du projet : la durée, le nombre de scènes et la part de votre interface que nous reconstruisons. Nous proposons un prix forfaitaire après un court échange.",
        },
      ],
    },
    quote: {
      heading: "Demander un devis.",
      text: "Dites-nous ce que fait votre produit et où la vidéo sera diffusée. Nous travaillons avec des équipes en France par visioconférence et fichiers partagés, et proposons un prix forfaitaire une fois le film cadré.",
    },
  },

  "es-ES": {
    serviceName: "Producción de vídeos explicativos SaaS y vídeos demo de producto",
    serviceType: "Producción de vídeos explicativos",
    areaServed: "Spain",
    metaTitle: "Vídeos explicativos SaaS para equipos IA en España - Mellon",
    metaDescription:
      "Mellon crea vídeos explicativos de producto premium y vídeos demo SaaS para equipos de IA y software en España: tu interfaz real, un guion preciso, en 3D.",
    headline: "Vídeos explicativos SaaS para productos de IA en España, animados en 3D.",
    summary:
      "Creamos vídeos explicativos SaaS y vídeos explicativos de producto premium para equipos de IA y software en España. Tu interfaz real, reconstruida y puesta en escena en 3D, para que el comprador vea qué hace el producto antes de leer una palabra.",
    video: {
      heading: "Un vídeo explicativo de producto premium, capítulo a capítulo.",
      intro:
        "Kryvex es un concepto que creamos para mostrar cómo trabajamos: un ingeniero de IA que rastrea una caída, escribe la solución y la demuestra. El producto es ficticio. El guion, la interfaz y el trabajo en 3D son nuestros.",
      title: "Vídeo explicativo de producto Kryvex, un concepto de Mellon",
      ...film,
      chaptersLabel: "Capítulos",
      pause: "Pausar vídeo",
      play: "Reproducir vídeo",
      chapters: [
        { title: "Señal", text: "Mil doscientas alertas se convierten en un solo incidente." },
        { title: "Causa", text: "El mapa de servicios se eleva y la ruta que falla se vuelve roja." },
        { title: "Solución", text: "La línea rota se hace añicos y el parche ocupa su lugar." },
        { title: "Prueba", text: "12.408 peticiones reproducidas pasan de rojo a verde." },
        { title: "Lanzamiento", text: "Las comprobaciones pasan, el canary llega al 100 % y la gráfica sube." },
      ].map((chapter, i) => ({ ...chapter, start: starts[i] })),
    },
    approach: {
      heading: "Cómo hacemos un vídeo explicativo SaaS.",
      intro: "Una historia en capítulos cortos, cada uno muestra una sola cosa que hace tu producto.",
      steps: [
        {
          title: "Historia",
          text: "Encontramos el problema que tu comprador ya reconoce y el momento en que tu producto lo resuelve. El guion de la locución va sincronizado con el vídeo, para que cada frase tenga un plano en el que caer.",
        },
        {
          title: "Interfaz",
          text: "Reconstruimos las pantallas de tu producto como una página web funcional con textos y datos reales, y las capturamos como imágenes y clips. El espectador ve tu interfaz, no una maqueta.",
        },
        {
          title: "Storyboard",
          text: "Cada capítulo tiene su propia cámara y una sola tarea: la señal, la causa, la solución, la prueba, el resultado. Marcamos los momentos en que entran la voz y la música.",
        },
        {
          title: "Producción 3D",
          text: "Construimos las escenas en Blender: simulaciones, telas, objetos que se rompen y miles de formas instanciadas, y lo precalculamos para que cualquier fotograma pueda revisarse y volver a renderizarse.",
        },
        {
          title: "Render y entrega",
          text: "Renderizamos un máster en 1080p a partir de una secuencia de imágenes, para que un render largo pueda continuar donde se detuvo, y codificamos versiones comprimidas para tu web.",
        },
      ],
    },
    included: {
      heading: "Qué incluye un vídeo demo de producto.",
      intro: "Cada vídeo se crea para el lugar donde se va a ver. Un proyecto puede incluir:",
      items: [
        {
          title: "Guion y guion de locución",
          text: "Un guion sincronizado con el vídeo, con notas de pronunciación y puntos de sincronización para la voz.",
        },
        {
          title: "Tu interfaz, reconstruida",
          text: "Pantallas recreadas a partir de tu producto con estados reales, para que el vídeo coincida con lo que verán tus clientes al iniciar sesión.",
        },
        {
          title: "Escenas 3D ajustables",
          text: "Escenas de Blender con una cámara por capítulo y efectos expuestos como ajustes, para que un cambio posterior de textos o datos no obligue a empezar de cero.",
        },
        {
          title: "Archivos listos para la web",
          text: "Un máster a resolución completa, versiones más ligeras para móvil y un fotograma de portada, listos para tu landing page.",
        },
      ],
    },
    partner: {
      heading: "Para quién es.",
      items: [
        {
          title: "Productos de IA difíciles de mostrar",
          text: "Los agentes y las automatizaciones trabajan fuera de la vista. Un vídeo muestra cada paso que una captura de pantalla no puede: qué lee, qué decide, qué cambia.",
        },
        {
          title: "Lanzamientos SaaS",
          text: "Un vídeo de lanzamiento para un producto nuevo o una funcionalidad importante, construido a partir de la interfaz que vas a lanzar para tus clientes en España.",
        },
        {
          title: "Ventas y primeras llamadas",
          text: "Un vídeo demo de producto corto que explica el producto antes de la primera llamada, para que la llamada empiece con preguntas.",
        },
        {
          title: "Equipos con una marca que cuidar",
          text: "Trabajamos con tu interfaz, tu tipografía y tus colores, para que el vídeo se parezca a tu producto y no a una plantilla.",
        },
      ],
    },
    faq: {
      heading: "Preguntas frecuentes.",
      items: [
        {
          question: "¿Qué es un vídeo explicativo SaaS?",
          answer:
            "Un vídeo corto que muestra qué hace un producto de software, para quién es y por qué importa, normalmente a través de su propia interfaz. Los nuestros están animados en 3D.",
        },
        {
          question: "¿En qué se diferencia un vídeo demo de producto de un vídeo explicativo?",
          answer:
            "Un vídeo explicativo cuenta la historia del problema y del resultado. Un vídeo demo de producto recorre la propia interfaz. Nosotros combinamos ambos: cada capítulo es una pantalla real con una función en la historia.",
        },
        {
          question: "¿Qué hace que un vídeo explicativo de producto sea premium?",
          answer:
            "Tu propia interfaz en lugar de pantallas genéricas, un guion en el que cada frase tiene su plano y escenas 3D iluminadas y renderizadas fotograma a fotograma en lugar de montadas a partir de una plantilla.",
        },
        {
          question: "¿Podéis hacer un vídeo explicativo para un producto de IA?",
          answer:
            "Sí. Los productos de IA encajan bien con el 3D, porque el trabajo de un agente es invisible en una captura de pantalla. Ponemos en escena cada paso para que el espectador pueda seguirlo.",
        },
        {
          question: "¿Trabajáis con empresas en España?",
          answer:
            "Sí. Trabajamos en remoto con equipos en España, por videollamada y con archivos compartidos, y el vídeo usa los textos de tu propio producto.",
        },
        {
          question: "¿Escribís el guion?",
          answer:
            "Sí. El guion va primero, y cada frase está ligada a un plano y a un momento antes de empezar el trabajo en 3D.",
        },
        {
          question: "¿Kryvex es un producto real?",
          answer:
            "No. Kryvex es un concepto que creamos para mostrar nuestro proceso. Tu vídeo usaría tu propio producto, tu interfaz y tu marca.",
        },
        {
          question: "¿Cuánto cuesta un vídeo explicativo?",
          answer:
            "Se presupuesta por proyecto: la duración, el número de escenas y cuánta parte de tu interfaz reconstruimos determinan el precio. Te damos un precio cerrado tras una breve llamada.",
        },
      ],
    },
    quote: {
      heading: "Pide presupuesto.",
      text: "Cuéntanos qué hace tu producto y dónde se verá el vídeo. Trabajamos con equipos en España por videollamada y archivos compartidos, y te damos un precio cerrado cuando el vídeo esté definido.",
    },
  },

  "nl-NL": {
    serviceName: "Productie van SaaS-explainervideo's en productdemovideo's",
    serviceType: "Productie van explainervideo's",
    areaServed: "Netherlands",
    metaTitle: "SaaS-explainervideo's voor AI-teams in Nederland - Mellon",
    metaDescription:
      "Mellon maakt premium productexplainervideo's en SaaS-demovideo's voor AI- en softwareteams in Nederland: je echte interface, een strak script, in 3D.",
    headline: "SaaS-explainervideo's voor AI-producten in Nederland, geanimeerd in 3D.",
    summary:
      "Wij maken SaaS-explainervideo's en premium productexplainervideo's voor AI- en softwareteams in Nederland. Je echte interface, nagebouwd en in 3D in beeld gebracht, zodat kopers zien wat het product doet voordat ze een woord lezen.",
    video: {
      heading: "Een premium productexplainervideo, hoofdstuk voor hoofdstuk.",
      intro:
        "Kryvex is een concept dat we maakten om te laten zien hoe we werken: een AI-engineer die een storing herleidt, de fix schrijft en bewijst dat die werkt. Het product is fictief. Het script, de interface en het 3D-werk zijn van ons.",
      title: "Kryvex productexplainervideo, een concept van Mellon",
      ...film,
      chaptersLabel: "Hoofdstukken",
      pause: "Video pauzeren",
      play: "Video afspelen",
      chapters: [
        { title: "Signaal", text: "Twaalfhonderd alerts komen binnen als één incident." },
        { title: "Oorzaak", text: "De servicekaart rijst op en het falende pad kleurt rood." },
        { title: "Fix", text: "De kapotte regel spat uiteen en de patch schuift erin." },
        { title: "Bewijs", text: "12.408 opnieuw afgespeelde requests springen van rood naar groen." },
        { title: "Live", text: "De checks slagen, de canary haalt 100% en de grafiek stijgt." },
      ].map((chapter, i) => ({ ...chapter, start: starts[i] })),
    },
    approach: {
      heading: "Zo maken we een SaaS-explainervideo.",
      intro: "Eén verhaal in korte hoofdstukken, die elk één ding laten zien dat je product doet.",
      steps: [
        {
          title: "Verhaal",
          text: "We zoeken het probleem dat je koper al herkent en het moment waarop je product het oplost. Het voice-overscript is getimed op de film, zodat elke zin een shot heeft om op te landen.",
        },
        {
          title: "Interface",
          text: "We bouwen de schermen van je product na als werkende webpagina met echte teksten en data, en leggen ze vast als stills en clips. Kijkers zien jouw interface, geen mock-up.",
        },
        {
          title: "Storyboard",
          text: "Elk hoofdstuk krijgt een eigen camera en één taak: het signaal, de oorzaak, de fix, het bewijs, het resultaat. We markeren de momenten waarop stem en muziek vallen.",
        },
        {
          title: "3D-productie",
          text: "We bouwen de scènes in Blender: simulaties, stof, brekende objecten en duizenden geïnstantieerde vormen, allemaal vooraf berekend zodat elk frame te controleren en opnieuw te renderen is.",
        },
        {
          title: "Render en oplevering",
          text: "We renderen een 1080p-master uit een beeldreeks, zodat een lange render verdergaat waar hij stopte, en coderen gecomprimeerde versies voor je website.",
        },
      ],
    },
    included: {
      heading: "Wat er in een productdemovideo zit.",
      intro: "Elke film wordt gemaakt voor de plek waar hij speelt. Een project kan bevatten:",
      items: [
        {
          title: "Script en voice-overscript",
          text: "Een script getimed op de film, met uitspraaknotities en synchronisatiepunten voor de stem.",
        },
        {
          title: "Je productinterface, nagebouwd",
          text: "Schermen nagemaakt uit je product met echte toestanden, zodat de film laat zien wat klanten zien na het inloggen.",
        },
        {
          title: "Aanpasbare 3D-scènes",
          text: "Blender-scènes met een camera per hoofdstuk en effecten als instellingen, zodat een latere wijziging in tekst of data niet betekent dat je opnieuw begint.",
        },
        {
          title: "Bestanden klaar voor het web",
          text: "Een master op volle resolutie, lichtere versies voor mobiel en een posterframe, klaar voor je landingspagina.",
        },
      ],
    },
    partner: {
      heading: "Voor wie het is.",
      items: [
        {
          title: "AI-producten die lastig te tonen zijn",
          text: "Agents en automatiseringen werken buiten beeld. Een film laat elke stap zien die een screenshot niet kan tonen: wat het leest, wat het beslist, wat het verandert.",
        },
        {
          title: "SaaS-lanceringen",
          text: "Een lanceringsvideo voor een nieuw product of een grote feature, gebouwd uit de interface die je op het punt staat te lanceren voor klanten in Nederland.",
        },
        {
          title: "Sales en eerste gesprekken",
          text: "Een korte productdemovideo die het product uitlegt vóór het eerste gesprek, zodat dat gesprek met vragen kan beginnen.",
        },
        {
          title: "Teams met een merk om te bewaken",
          text: "We werken vanuit je interface, typografie en kleuren, zodat de film eruitziet als jouw product en niet als een template.",
        },
      ],
    },
    faq: {
      heading: "Veelgestelde vragen.",
      items: [
        {
          question: "Wat is een SaaS-explainervideo?",
          answer:
            "Een korte film die laat zien wat een softwareproduct doet, voor wie het is en waarom het ertoe doet, meestal via de eigen interface van het product. De onze zijn geanimeerd in 3D.",
        },
        {
          question: "Wat is het verschil tussen een productdemovideo en een explainervideo?",
          answer:
            "Een explainervideo vertelt het verhaal van het probleem en de uitkomst. Een productdemovideo loopt door de interface zelf. Wij combineren die twee: elk hoofdstuk is een echt scherm met één rol in het verhaal.",
        },
        {
          question: "Wat maakt een productexplainervideo premium?",
          answer:
            "Je eigen interface in plaats van stockschermen, een script waarin elke zin een shot heeft, en 3D-scènes die frame voor frame belicht en gerenderd zijn in plaats van in elkaar gezet uit een template.",
        },
        {
          question: "Kunnen jullie een explainervideo maken voor een AI-product?",
          answer:
            "Ja. AI-producten lenen zich goed voor 3D, omdat het werk van een agent onzichtbaar is op een screenshot. We brengen elke stap in beeld, zodat kijkers die kunnen volgen.",
        },
        {
          question: "Werken jullie met bedrijven in Nederland?",
          answer:
            "Ja. We werken op afstand met teams in Nederland, via videogesprekken en gedeelde bestanden, en de film gebruikt de teksten van je eigen product.",
        },
        {
          question: "Schrijven jullie het script?",
          answer:
            "Ja. Het script komt eerst, en elke zin is gekoppeld aan een shot en een moment voordat het 3D-werk begint.",
        },
        {
          question: "Is Kryvex een echt product?",
          answer:
            "Nee. Kryvex is een concept dat we maakten om ons proces te laten zien. Jouw film gebruikt je eigen product, interface en merk.",
        },
        {
          question: "Wat kost een explainervideo?",
          answer:
            "Dat bepalen we per project: de lengte, het aantal scènes en hoeveel van je interface we nabouwen bepalen de prijs. Na een kort gesprek geven we een vaste prijs.",
        },
      ],
    },
    quote: {
      heading: "Vraag een offerte aan.",
      text: "Vertel ons wat je product doet en waar de video te zien zal zijn. We werken met teams in Nederland via videogesprekken en gedeelde bestanden, en geven een vaste prijs zodra de film is afgebakend.",
    },
  },
};
