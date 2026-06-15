import type { InfoDocument } from "./types";

export const aProposBlocks: InfoDocument = [
  { kind: "h1", text: "À propos de Constellation" },
  {
    kind: "p",
    text: "[Description principale du produit — à compléter. Ex : Constellation est un assistant intelligent conçu pour …]",
  },

  { kind: "h2", text: "Notre mission" },
  {
    kind: "p",
    text: "[Décrivez la mission et les valeurs du produit — à compléter.]",
  },

  { kind: "h2", text: "Ce que nous construisons" },
  {
    kind: "p",
    text: "[Présentation des fonctionnalités clés ou de la vision produit — à compléter.]",
  },
  { kind: "bullet", text: "[Fonctionnalité ou valeur clé 1 — à compléter]" },
  { kind: "bullet", text: "[Fonctionnalité ou valeur clé 2 — à compléter]" },
  { kind: "bullet", text: "[Fonctionnalité ou valeur clé 3 — à compléter]" },

  { kind: "h2", text: "L'équipe" },
  {
    kind: "p",
    text: "[Présentation de l'équipe ou de l'organisation — à compléter.]",
  },

  { kind: "h2", text: "Contact" },
  {
    kind: "p",
    text: "Pour nous contacter : [Email — à compléter]. Nous sommes également disponibles sur [Réseau social / lien — à compléter].",
  },
] as const;
