import type { InfoDocument } from "./types";

export const confidentialiteBlocks: InfoDocument = [
  { kind: "h1", text: "Politique de confidentialité" },
  {
    kind: "p",
    text: "Votre vie privée est importante pour nous. Cette politique décrit les données personnelles que nous collectons, la manière dont nous les utilisons et vos droits à leur égard.",
  },

  { kind: "h2", text: "Responsable du traitement" },
  { kind: "p", text: "[Raison sociale — à compléter], [Adresse — à compléter]." },
  { kind: "p", text: "Contact DPO : [Email — à compléter]" },

  { kind: "h2", text: "Données collectées" },
  {
    kind: "p",
    text: "Lors de la création de votre compte et de l'utilisation du service, nous sommes amenés à collecter les données suivantes :",
  },
  { kind: "bullet", text: "Adresse email (identifiant de connexion)" },
  { kind: "bullet", text: "Nom ou pseudonyme (optionnel, fourni par vous)" },
  {
    kind: "bullet",
    text: "Données de connexion (adresse IP, navigateur, date et heure)",
  },
  {
    kind: "bullet",
    text: "Données d'usage (fonctionnalités utilisées, préférences de langue)",
  },

  { kind: "h2", text: "Finalités et bases légales" },
  { kind: "p", text: "Nous utilisons vos données pour :" },
  {
    kind: "bullet",
    text: "Fournir et améliorer le service (intérêt légitime / exécution du contrat)",
  },
  {
    kind: "bullet",
    text: "Assurer la sécurité de votre compte (intérêt légitime)",
  },
  {
    kind: "bullet",
    text: "Respecter nos obligations légales (conformité réglementaire)",
  },
  {
    kind: "bullet",
    text: "Vous envoyer des communications de service (consentement ou contrat)",
  },

  { kind: "h2", text: "Durée de conservation" },
  {
    kind: "p",
    text: "Vos données sont conservées pour la durée de votre relation avec nous, augmentée des délais légaux applicables. Les données de connexion sont conservées 12 mois conformément aux obligations légales.",
  },

  { kind: "h2", text: "Partage des données" },
  {
    kind: "p",
    text: "Vos données ne sont pas vendues. Elles peuvent être transmises à des sous-traitants techniques (hébergement, emailing) soumis à des garanties contractuelles équivalentes (DPA, clauses contractuelles types UE).",
  },

  { kind: "h2", text: "Vos droits" },
  { kind: "p", text: "Conformément au RGPD, vous disposez des droits suivants :" },
  { kind: "bullet", text: "Droit d'accès à vos données personnelles" },
  { kind: "bullet", text: "Droit de rectification des données inexactes" },
  { kind: "bullet", text: "Droit à l'effacement (« droit à l'oubli »)" },
  { kind: "bullet", text: "Droit à la portabilité de vos données" },
  { kind: "bullet", text: "Droit d'opposition et de limitation du traitement" },
  {
    kind: "p",
    text: "Pour exercer ces droits, contactez-nous à [Email DPO — à compléter]. Vous pouvez également adresser une réclamation à la CNIL (www.cnil.fr).",
  },

  { kind: "h2", text: "Cookies" },
  {
    kind: "p",
    text: "Le site utilise des cookies strictement nécessaires au fonctionnement du service (session d'authentification). Aucun cookie publicitaire ou de traçage tiers n'est déposé sans votre consentement explicite.",
  },

  { kind: "h2", text: "Modifications" },
  {
    kind: "p",
    text: "Cette politique peut être mise à jour. En cas de modification substantielle, vous serez informé par email ou par un bandeau visible sur le service. Date de dernière mise à jour : [Date — à compléter].",
  },
] as const;
