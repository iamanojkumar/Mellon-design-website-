import type { ServiceLandingCopy } from "@/components/landing/ServiceLanding";

/**
 * French (France) version of the Figma design system landing page
 * (../figma-design-system-agency-india). Written for the French market rather
 * than translated word for word: vouvoiement, "nous", sentence-case headings,
 * and the site's own vocabulary (jetons, bibliothèques de composants, design
 * systems). Target phrase: "agence design system Figma".
 */
export const copy: Record<string, ServiceLandingCopy> = {
  "fr-FR": {
    serviceName: "Conception et développement de design system Figma",
    serviceType: "Agence de design system",
    areaServed: "France",
    metaTitle: "Agence design system Figma en Inde — Mellon",
    metaDescription:
      "Agence de design en Inde : Mellon crée des design systems Figma pour équipes produit françaises. Audit, jetons, composants liés au code, transfert.",
    headline: "Une agence de design system Figma en Inde pour les équipes produit françaises.",
    summary:
      "Mellon est une agence de design basée en Inde. Nous créons des design systems complets dans Figma et les reproduisons dans le code, et nous travaillons avec les équipes françaises grâce à des points hebdomadaires et des bibliothèques partagées, pour que vos designers et vos ingénieurs cessent de reconstruire les mêmes composants et reviennent au produit.",
    approach: {
      heading: "Comment nous construisons un design system.",
      intro: "Cinq étapes, dans l'ordre. Chacune se termine par un livrable que votre équipe peut relire.",
      steps: [
        {
          title: "Problème",
          text: "Nous commençons par nommer ce qui ne fonctionne vraiment pas : composants d'interface incohérents, transferts brouillons entre designers et développeurs, ou parcours utilisateur fragmentés dans votre produit.",
        },
        {
          title: "Audit",
          text: "Nous comparons trois choses côte à côte : ce que documente votre design system, ce que contiennent vos fichiers Figma et ce que le code de votre produit affiche réellement. Les écarts deviennent le cahier des charges.",
        },
        {
          title: "Feuille de route",
          text: "Nous transformons l'audit en jalons et en calendrier liés à vos objectifs, à vos priorités et au périmètre, pour que vous sachiez ce qui est livré en premier, et pourquoi.",
        },
        {
          title: "Design",
          text: "Nous standardisons la typographie, les jetons de couleur et l'espacement dans une même base, puis nous construisons les composants par-dessus.",
        },
        {
          title: "Exécution",
          text: "Les composants deviennent des bibliothèques réutilisables qui synchronisent les jetons de design avec votre code. Après le lancement, nous continuons de suivre les taux d'adoption et les bugs de performance, pour que le système soit utilisé plutôt que rangé.",
        },
      ],
    },
    included: {
      heading: "Ce que vous obtenez.",
      intro:
        "Un système gouverné sur lequel le design et l'ingénierie s'appuient tous les deux. Chaque mission comprend :",
      items: [
        {
          title: "Architecture de jetons",
          text: "Jetons de couleur, de typographie, d'espacement et d'animation, définis une fois et partagés entre Figma et le code.",
        },
        {
          title: "Bibliothèques de composants",
          text: "Construites dans Figma et reproduites dans le code, en React, Angular, Vue ou mobile natif.",
        },
        {
          title: "Documentation",
          text: "Guides d'usage et règles de contribution, pour que le système garde sa forme à mesure que votre équipe grandit.",
        },
        {
          title: "Accompagnement du déploiement",
          text: "Une aide pour faire migrer vos produits et vos équipes existants vers le système, section par section.",
        },
      ],
    },
    partner: {
      heading: "Comment nous travaillons avec votre équipe.",
      items: [
        {
          title: "Une communication claire",
          text: "Des points d'alignement hebdomadaires et des bibliothèques Figma et dépôts GitHub partagés permettent aux designers et aux ingénieurs de regarder la même chose.",
        },
        {
          title: "L'efficacité dès la conception",
          text: "Une seule équipe senior mène l'audit, le design et le transfert, pour que rien ne se perde entre les phases.",
        },
        {
          title: "Un suivi après le lancement",
          text: "Nous restons disponibles après la livraison pour répondre aux questions et aider votre équipe à maintenir le système.",
        },
        {
          title: "Une livraison adaptée",
          text: "Nous cadrons chaque mission selon votre produit et votre stack, et nous livrons ce dont votre équipe a réellement besoin.",
        },
      ],
    },
    caseStudies: {
      heading: "Études de cas.",
      cta: "Demander l'étude de cas",
      items: [{ name: "GetReplies" }, { name: "Mellon" }, { name: "CogitX" }],
    },
    faq: {
      heading: "Questions fréquentes.",
      items: [
        {
          question: "Une agence de design en Inde peut-elle bien travailler avec une équipe française ?",
          answer:
            "Oui. Nous travaillons avec des points d'alignement hebdomadaires, des ateliers de co-création et des bibliothèques Figma et dépôts GitHub partagés, pour que votre équipe voie l'avancement et donne son avis tout au long du projet, pas seulement à la livraison.",
        },
        {
          question: "Pourquoi faire appel à une agence plutôt que de construire un design system en interne ?",
          answer:
            "Une agence apporte une expertise spécialisée et une équipe dédiée : vous lancez un système de base plusieurs mois plus tôt, sans détourner vos designers et vos ingénieurs de la feuille de route produit.",
        },
        {
          question: "Comment le design system s'intègre-t-il à notre stack technique ?",
          answer:
            "Nous travaillons avec vos responsables techniques dès le départ, en construisant des composants et des jetons de design adaptés à votre framework, qu'il s'agisse de React, d'Angular, de Vue ou du mobile natif.",
        },
        {
          question: "Faut-il refondre tout notre produit pour adopter un design system ?",
          answer:
            "Non. Nous déployons le système par étapes, en commençant par des pages à faible risque ou par des éléments partagés à fort impact comme la navigation et les boutons, puis nous migrons les anciennes interfaces au fil du temps.",
        },
        {
          question: "Comment travaillez-vous avec nos équipes design et ingénierie ?",
          answer:
            "Par des ateliers de co-création, des points d'alignement hebdomadaires et des bibliothèques Figma et dépôts GitHub partagés, pour que les transferts se passent bien et que les deux équipes aient leur mot à dire.",
        },
        {
          question: "Que se passe-t-il quand vous avez terminé le système ?",
          answer:
            "Nous le transmettons dans les règles : ateliers de formation, règles de gouvernance et documentation, pour que votre équipe puisse maintenir et faire évoluer le système sans nous.",
        },
        {
          question: "Comment savoir si le design system fonctionne ?",
          answer:
            "Nous suivons l'adoption des composants dans votre code, le temps de mise sur le marché des nouvelles fonctionnalités et le nombre de bugs de QA liés au design.",
        },
      ],
    },
    quote: {
      heading: "Demander un devis.",
      text: "Le prix dépend de la taille de votre produit et de l'état de votre système actuel, nous le cadrons donc avec vous. Nous avons créé des design systems pour des startups et pour de grandes entreprises. Dites-nous où en est le vôtre et nous vous répondrons sous un jour ouvré.",
    },
  },
};
