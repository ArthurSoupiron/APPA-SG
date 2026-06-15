/** Libellés UI — alignés sur `backend/src/lib/crm/apollo-prospect-fields.ts`. */
export const CRM_APOLLO_PROSPECT_FIELD_LABELS = {
  titre: "Intitulé de poste",
  emailStatut: "Statut e-mail (Apollo)",
  emailSecondaire: "E-mail secondaire",
  telephoneMobile: "Mobile",
  telephoneCorporate: "Téléphone entreprise",
  telephoneDirect: "Ligne directe",
  ville: "Ville",
  region: "Région / État",
  pays: "Pays",
  seniorite: "Séniorité",
  departements: "Départements",
  twitter: "Twitter / X",
  facebook: "Facebook",
  github: "GitHub",
  siteWeb: "Site web",
  linkedinEntreprise: "LinkedIn entreprise",
  effectifs: "Effectifs",
  motsCles: "Mots-clés",
  technologies: "Technologies",
  chiffreAffaires: "Chiffre d'affaires",
  anneeFondation: "Année de fondation",
  adresseEntreprise: "Adresse entreprise",
  villeEntreprise: "Ville entreprise",
  regionEntreprise: "Région entreprise",
  paysEntreprise: "Pays entreprise",
  codePostalEntreprise: "Code postal entreprise",
  telephoneEntreprise: "Téléphone siège",
  entreprisePourEmails: "Entreprise (e-mails)",
  apolloContactId: "ID contact Apollo",
  apolloAccountId: "ID compte Apollo",
  etapeApollo: "Étape Apollo",
  proprietaireApollo: "Propriétaire Apollo",
} as const;

export type CrmApolloProspectFieldKey = keyof typeof CRM_APOLLO_PROSPECT_FIELD_LABELS;

export const CRM_APOLLO_PROSPECT_FIELD_KEYS = Object.keys(
  CRM_APOLLO_PROSPECT_FIELD_LABELS,
) as CrmApolloProspectFieldKey[];

export const CRM_APOLLO_PROSPECT_FIELD_GROUPS: {
  title: string;
  keys: CrmApolloProspectFieldKey[];
}[] = [
  {
    title: "Contact",
    keys: [
      "titre",
      "emailStatut",
      "emailSecondaire",
      "telephoneMobile",
      "telephoneCorporate",
      "telephoneDirect",
      "ville",
      "region",
      "pays",
      "seniorite",
      "departements",
      "twitter",
      "facebook",
      "github",
      "etapeApollo",
      "proprietaireApollo",
      "apolloContactId",
    ],
  },
  {
    title: "Entreprise",
    keys: [
      "entreprisePourEmails",
      "siteWeb",
      "linkedinEntreprise",
      "effectifs",
      "motsCles",
      "technologies",
      "chiffreAffaires",
      "anneeFondation",
      "adresseEntreprise",
      "villeEntreprise",
      "regionEntreprise",
      "paysEntreprise",
      "codePostalEntreprise",
      "telephoneEntreprise",
      "apolloAccountId",
    ],
  },
];
