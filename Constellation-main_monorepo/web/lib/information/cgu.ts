import type { InfoDocument } from "./types";

export const cguBlocks: InfoDocument = [
  { kind: "h1", text: "Conditions générales d'utilisation" },
  {
    kind: "p",
    text: "Les présentes conditions générales d'utilisation (CGU) régissent l'accès et l'utilisation du service Jarvis. En créant un compte ou en utilisant le service, vous acceptez sans réserve ces CGU.",
  },

  { kind: "h2", text: "1. Description du service" },
  {
    kind: "p",
    text: "Jarvis est [description courte du produit — à compléter]. Le service est accessible depuis tout navigateur moderne à l'adresse [URL — à compléter].",
  },

  { kind: "h2", text: "2. Accès et compte utilisateur" },
  {
    kind: "p",
    text: "L'accès au service est réservé aux personnes physiques majeures. La création d'un compte est gratuite et nécessite une adresse email valide.",
  },
  {
    kind: "p",
    text: "Vous êtes responsable de la confidentialité de vos identifiants et de toute activité effectuée depuis votre compte. En cas de compromission suspectée, vous devez nous en informer immédiatement.",
  },

  { kind: "h2", text: "3. Utilisation acceptable" },
  {
    kind: "p",
    text: "Vous vous engagez à utiliser le service conformément aux lois en vigueur et aux présentes CGU. Il est notamment interdit de :",
  },
  {
    kind: "bullet",
    text: "Porter atteinte aux droits de tiers (propriété intellectuelle, vie privée, etc.)",
  },
  {
    kind: "bullet",
    text: "Diffuser des contenus illicites, haineux, trompeurs ou portant atteinte à la dignité des personnes",
  },
  {
    kind: "bullet",
    text: "Tenter d'accéder sans autorisation à des systèmes ou données tiers",
  },
  {
    kind: "bullet",
    text: "Utiliser le service à des fins de spam, phishing ou toute autre activité malveillante",
  },
  {
    kind: "bullet",
    text: "Procéder à de l'ingénierie inverse ou scraping non autorisé du service",
  },

  { kind: "h2", text: "4. Propriété intellectuelle" },
  {
    kind: "p",
    text: "Le service, ses composants logiciels, son design et ses contenus sont protégés par le droit de la propriété intellectuelle. Aucune licence n'est accordée au-delà de ce qui est strictement nécessaire à l'utilisation du service.",
  },

  { kind: "h2", text: "5. Données personnelles" },
  {
    kind: "p",
    text: "Le traitement des données personnelles est décrit dans notre Politique de confidentialité, accessible depuis ce site.",
  },

  { kind: "h2", text: "6. Disponibilité et modifications" },
  {
    kind: "p",
    text: "Nous faisons de notre mieux pour assurer la disponibilité continue du service, sans toutefois la garantir. Nous nous réservons le droit de modifier, suspendre ou interrompre tout ou partie du service, avec ou sans préavis.",
  },
  {
    kind: "p",
    text: "Ces CGU peuvent être modifiées à tout moment. La version en vigueur est celle publiée sur ce site. L'utilisation continue du service vaut acceptation des CGU mises à jour.",
  },

  { kind: "h2", text: "7. Responsabilité" },
  {
    kind: "p",
    text: "Dans les limites autorisées par la loi applicable, notre responsabilité est limitée aux dommages directs résultant d'une faute prouvée de notre part. Nous ne saurions être tenus responsables des dommages indirects, pertes de données ou interruptions de service.",
  },

  { kind: "h2", text: "8. Résiliation" },
  {
    kind: "p",
    text: "Vous pouvez supprimer votre compte à tout moment depuis la page de votre profil. Nous nous réservons le droit de suspendre ou supprimer un compte en cas de violation des présentes CGU.",
  },

  { kind: "h2", text: "9. Droit applicable" },
  {
    kind: "p",
    text: "Les présentes CGU sont soumises au droit français. En cas de litige, les parties s'engagent à rechercher une solution amiable. À défaut, les tribunaux compétents du ressort de [Ville — à compléter] seront seuls compétents.",
  },

  { kind: "h2", text: "10. Contact" },
  {
    kind: "p",
    text: "Pour toute question relative à ces CGU : [Email — à compléter].",
  },
] as const;
