export type CanonicalTemplateDocType =
  | "CCA"
  | "BC"
  | "BCR"
  | "RMI"
  | "ARMI"
  | "PVRF";

export function normalizeTemplateKey(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

export const CANONICAL_TAGS_BY_DOC: Record<CanonicalTemplateDocType, string[]> = {
  CCA: [
    "DOC_REFERENCE",
    "DOC_DATE_EDITION",
    "MISSION_DESCRIPTION",
    "MISSION_CONTEXT",
    "MISSION_OBJECTIFS",
    "ENTREPRISE_NAME",
    "CDP_NOM",
    "CDP_PRENOM",
    "CDP_EMAIL",
    "CDP_TELEPHONE",
    "CLIENT_NOM",
    "CLIENT_PRENOM",
    "CLIENT_EMAIL",
    "CLIENT_TELEPHONE",
    "CLIENT_PROFESSION",
    "CLIENT_ADRESSE",
  ],
  BC: [
    "DOC_DATE_EDITION",
    "MISSION_CONTEXT",
    "ENTREPRISE_NAME",
    "CLIENT_NOM",
    "CLIENT_PRENOM",
    "CLIENT_EMAIL",
    "CLIENT_TELEPHONE",
    "CLIENT_PROFESSION",
    "CLIENT_ADRESSE",
    "MISSION_DESCRIPTION",
    "PHASE_1_NAME",
    "PHASE_2_NAME",
    "PHASE_3_NAME",
  ],
  BCR: [
    "DOC_DATE_EDITION",
    "MISSION_CONTEXT",
    "ENTREPRISE_NAME",
    "CLIENT_NOM",
    "CLIENT_PRENOM",
    "CLIENT_EMAIL",
    "CLIENT_TELEPHONE",
    "CLIENT_PROFESSION",
    "CLIENT_ADRESSE",
    "MISSION_DESCRIPTION",
    "PHASE_1_NAME",
    "PHASE_2_NAME",
    "PHASE_3_NAME",
    "BC_PREVIOUS_REFERENCE",
  ],
  RMI: [
    "DOC_REFERENCE",
    "DOC_DATE_SIGNATURE",
    "MISSION_DATE_FIN",
    "MISSION_DESCRIPTION",
    "ETUDE_REFERENCE",
    "BC_NUMBER",
    "JEH_TOTAL",
    "REMUNERATION_BRUTE",
    "REMUNERATION_BRUTE_L",
    "INTERVENANT_NOM",
    "INTERVENANT_PRENOM",
    "INTERVENANT_EMAIL",
    "INTERVENANT_TELEPHONE",
    "INTERVENANT_ADRESSE",
    "CDP_NOM",
    "CDP_PRENOM",
    "CDP_EMAIL",
    "CDP_TELEPHONE",
    "CLIENT_NOM",
    "CLIENT_PRENOM",
  ],
  ARMI: [
    "DOC_REFERENCE",
    "DOC_DATE_SIGNATURE",
    "MISSION_DATE_FIN_NOUVELLE",
    "ETUDE_REFERENCE",
    "ETUDE_REF_INTERNE",
    "BC_NUMBER",
    "BCR_NUMBER",
    "JEH_TOTAL",
    "REMUNERATION_BRUTE",
    "REMUNERATION_BRUTE_L",
    "INTERVENANT_NOM",
    "INTERVENANT_PRENOM",
    "INTERVENANT_EMAIL",
    "INTERVENANT_TELEPHONE",
    "INTERVENANT_ADRESSE",
    "INTERVENANT_TACHES",
    "CDP_NOM",
    "CDP_PRENOM",
    "CDP_EMAIL",
    "CDP_TELEPHONE",
  ],
  PVRF: [
    "DOC_REFERENCE",
    "DOC_DATE_EDITION",
    "MISSION_REFERENCE",
    "ETUDE_REFERENCE",
    "ENTREPRISE_NAME",
    "CLIENT_NOM",
    "CLIENT_PRENOM",
    "CLIENT_EMAIL",
    "CLIENT_TELEPHONE",
    "CLIENT_PROFESSION",
    "CLIENT_ADRESSE",
    "CDP_NOM",
    "CDP_PRENOM",
    "CDP_EMAIL",
    "CDP_TELEPHONE",
  ],
};

const ALIASES: Record<string, string> = {
  Nom_Entreprise: "ENTREPRISE_NAME",
  "Nom Société": "ENTREPRISE_NAME",
  Nom_Contact: "CLIENT_NOM",
  Prénom_Contact: "CLIENT_PRENOM",
  Mail_Contact: "CLIENT_EMAIL",
  Tel_Contact: "CLIENT_TELEPHONE",
  Adresse_Client: "CLIENT_ADRESSE",
  "Adresse Client": "CLIENT_ADRESSE",
  Profession_Contact: "CLIENT_PROFESSION",
  Nom_CDP: "CDP_NOM",
  "NOM CdP": "CDP_NOM",
  "NOM CDP": "CDP_NOM",
  "Prénom CdP": "CDP_PRENOM",
  Prénom_CDP: "CDP_PRENOM",
  Mail_CDP: "CDP_EMAIL",
  "Mail CdP": "CDP_EMAIL",
  Tel_CDP: "CDP_TELEPHONE",
  "Téléphone CdP": "CDP_TELEPHONE",
  "Numéro BC": "BC_NUMBER",
  "Numéro BCR": "BCR_NUMBER",
  "Référence étude": "ETUDE_REFERENCE",
  "Réf int": "ETUDE_REF_INTERNE",
  "Réf ARM": "DOC_REFERENCE",
  refDoc: "DOC_REFERENCE",
  "Date Edition": "DOC_DATE_EDITION",
  "Date d'édition": "DOC_DATE_EDITION",
  "Date de Signature": "DOC_DATE_SIGNATURE",
  "Date signature": "DOC_DATE_SIGNATURE",
  "Nombre JEH": "JEH_TOTAL",
  "Nombre de JEH": "JEH_TOTAL",
  "Rétribution Brute": "REMUNERATION_BRUTE",
  "Rétribution Brut-L": "REMUNERATION_BRUTE_L",
  "Rétribution Brute-L": "REMUNERATION_BRUTE_L",
  "Nom Client": "CLIENT_NOM",
  "Prénom Client": "CLIENT_PRENOM",
  "Mail Client": "CLIENT_EMAIL",
  "Téléphone Client": "CLIENT_TELEPHONE",
};

const NORMALIZED_ALIAS = new Map<string, string>(
  Object.entries(ALIASES).map(([k, v]) => [normalizeTemplateKey(k), v]),
);

export function toCanonicalTag(tag: string): string {
  const normalized = normalizeTemplateKey(tag);
  return NORMALIZED_ALIAS.get(normalized) ?? tag;
}

export function resolvePrefillByTags(
  tags: string[],
  prefill: Record<string, string>,
): Record<string, string> {
  const normalizedPrefill = new Map<string, string>();
  for (const [key, value] of Object.entries(prefill)) {
    normalizedPrefill.set(normalizeTemplateKey(key), value);
    const canonical = toCanonicalTag(key);
    normalizedPrefill.set(normalizeTemplateKey(canonical), value);
  }

  const resolved: Record<string, string> = {};
  for (const tag of tags) {
    const direct = prefill[tag];
    if (direct !== undefined) {
      resolved[tag] = direct;
      continue;
    }
    const canonicalTag = toCanonicalTag(tag);
    resolved[tag] =
      normalizedPrefill.get(normalizeTemplateKey(tag)) ??
      normalizedPrefill.get(normalizeTemplateKey(canonicalTag)) ??
      "";
  }
  return resolved;
}

export function getTemplateTagAudit(
  docType: CanonicalTemplateDocType,
  tags: string[],
): { unknownTags: string[] } {
  const canonical = new Set(CANONICAL_TAGS_BY_DOC[docType].map(normalizeTemplateKey));
  const unknownTags = tags.filter((tag) => {
    const normalizedTag = normalizeTemplateKey(tag);
    if (canonical.has(normalizedTag)) return false;
    const canonicalAlias = toCanonicalTag(tag);
    return !canonical.has(normalizeTemplateKey(canonicalAlias));
  });
  return { unknownTags };
}
