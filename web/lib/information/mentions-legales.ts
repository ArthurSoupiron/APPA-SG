import type { InfoDocument } from "./types";

export const mentionsLegalesBlocks: InfoDocument = [
  { kind: "h1", text: "Mentions légales" },
  {
    kind: "p",
    text: "Conformément aux dispositions de la loi n° 2004-575 du 21 juin 2004 pour la confiance en l'économie numérique, il est précisé aux utilisateurs du site l'identité des différents intervenants dans le cadre de sa réalisation et de son suivi.",
  },

  { kind: "h2", text: "Éditeur du site" },
  { kind: "p", text: "[Raison sociale — à compléter]" },
  { kind: "p", text: "Adresse : [Adresse — à compléter]" },
  { kind: "p", text: "Capital social : [Montant — à compléter]" },
  { kind: "p", text: "Numéro SIREN / SIRET : [Numéro — à compléter]" },
  { kind: "p", text: "Directeur de la publication : [Nom — à compléter]" },
  { kind: "p", text: "Contact : [Adresse email — à compléter]" },

  { kind: "h2", text: "Hébergement" },
  { kind: "p", text: "Le site est hébergé par :" },
  { kind: "p", text: "[Nom de l'hébergeur — à compléter]" },
  { kind: "p", text: "Adresse : [Adresse hébergeur — à compléter]" },
  { kind: "p", text: "Site web : [URL hébergeur — à compléter]" },

  { kind: "h2", text: "Propriété intellectuelle" },
  {
    kind: "p",
    text: "L'ensemble du contenu du site (textes, images, graphismes, logo, icônes, sons, logiciels…) est la propriété exclusive de l'éditeur, à l'exception des marques, logos ou contenus appartenant à d'autres sociétés partenaires ou auteurs.",
  },
  {
    kind: "p",
    text: "Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable de l'éditeur.",
  },

  { kind: "h2", text: "Responsabilité" },
  {
    kind: "p",
    text: "Les informations contenues sur ce site sont aussi précises que possible et le site est périodiquement remis à jour, mais peut toutefois contenir des inexactitudes, des omissions ou des lacunes. Si vous constatez une lacune, erreur ou ce qui paraît être un dysfonctionnement, merci de bien vouloir le signaler par email en décrivant le problème.",
  },

  { kind: "h2", text: "Liens hypertextes" },
  {
    kind: "p",
    text: "Le site peut contenir des liens hypertextes vers d'autres sites présents sur le réseau Internet. Les liens vers ces autres ressources vous font quitter le site. Il est possible de créer un lien vers la page de présentation de ce site sans autorisation expresse de l'éditeur.",
  },
] as const;
