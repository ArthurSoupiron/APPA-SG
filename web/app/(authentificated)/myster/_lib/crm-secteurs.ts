/**
 * Sections NAF rév. 2 (nomenclature d’activités française, alignée NACE rév. 2).
 * Réf. : https://www.insee.fr/fr/metadonnees/nafr2/section
 * Valeur stockée : « {code} — {libellé} » pour rester lisible en base et exports.
 */
const SECTIONS_NAF2 = [
  { code: "A", label: "Agriculture, sylviculture et pêche" },
  { code: "B", label: "Industries extractives" },
  { code: "C", label: "Industrie manufacturière" },
  {
    code: "D",
    label: "Production et distribution d'électricité, de gaz, de vapeur et d'air conditionné",
  },
  {
    code: "E",
    label: "Production et distribution d'eau ; assainissement, gestion des déchets et dépollution",
  },
  { code: "F", label: "Construction" },
  {
    code: "G",
    label: "Commerce ; réparation d'automobiles et de motocycles",
  },
  { code: "H", label: "Transports et entreposage" },
  { code: "I", label: "Hébergement et restauration" },
  { code: "J", label: "Information et communication" },
  { code: "K", label: "Activités financières et d'assurance" },
  { code: "L", label: "Activités immobilières" },
  {
    code: "M",
    label: "Activités spécialisées, scientifiques et techniques",
  },
  {
    code: "N",
    label: "Activités de services administratifs et de soutien",
  },
  { code: "O", label: "Administration publique" },
  { code: "P", label: "Enseignement" },
  { code: "Q", label: "Santé humaine et action sociale" },
  {
    code: "R",
    label: "Arts, spectacles et activités récréatives",
  },
  { code: "S", label: "Autres activités de services" },
  {
    code: "T",
    label: "Activités des ménages en tant qu'employeurs ; activités indifférenciées des ménages",
  },
  {
    code: "U",
    label: "Activités des organisations et organismes extraterritoriaux",
  },
] as const;

export function crmSecteurValue(code: string, label: string): string {
  return `${code} — ${label}`;
}

/** Sentinelle UI (Radix Select évite souvent `value=""`). */
export const CRM_SECTEUR_SELECT_EMPTY = "__crm_secteur_empty__";

/** Filtre liste / sprint : ne restreint pas par secteur (pas une valeur enregistrée sur le prospect). */
export const CRM_SECTEUR_FILTER_ALL = "__crm_secteur_filter_all__";

export const CRM_SECTEURS_OPTIONS: { value: string; label: string }[] = [
  { value: CRM_SECTEUR_SELECT_EMPTY, label: "Non renseigné" },
  ...SECTIONS_NAF2.map((s) => ({
    value: crmSecteurValue(s.code, s.label),
    label: crmSecteurValue(s.code, s.label),
  })),
];

/** Même entrées que la fiche prospect (`CRM_SECTEURS_OPTIONS`) + « Tous les secteurs » pour les filtres. */
export const CRM_SECTEURS_OPTIONS_WITH_FILTER_ALL: { value: string; label: string }[] = [
  { value: CRM_SECTEUR_FILTER_ALL, label: "Tous les secteurs" },
  ...CRM_SECTEURS_OPTIONS,
];

export const CRM_SECTEUR_KNOWN_VALUES = new Set(
  SECTIONS_NAF2.map((s) => crmSecteurValue(s.code, s.label)),
);

export function isKnownCrmSecteur(v: string | null | undefined): boolean {
  if (!v) return true;
  return CRM_SECTEUR_KNOWN_VALUES.has(v);
}
