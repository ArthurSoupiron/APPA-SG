import type { prospect } from "../../db/schema";
import { normalizeProspectPhoneFields } from "./normalize-phone";
import { normalizeImportRowKeys } from "./prospect-import-parse";

export type ProspectInsertFields = Omit<
  typeof prospect.$inferInsert,
  "id" | "createdAt" | "updatedAt" | "createdBy"
>;

/** Colonne DB → libellé UI + en-têtes CSV Apollo reconnus à l’import. */
export const APOLLO_PROSPECT_FIELD_DEFS = [
  { key: "titre", label: "Intitulé de poste", csvKeys: ["title", "job_title"] },
  {
    key: "emailStatut",
    label: "Statut e-mail (Apollo)",
    csvKeys: ["email_status", "email_verification_status"],
  },
  {
    key: "emailSecondaire",
    label: "E-mail secondaire",
    csvKeys: ["secondary_email", "alternate_email", "other_email"],
  },
  {
    key: "telephoneMobile",
    label: "Mobile",
    csvKeys: ["mobile_phone", "cell_phone"],
  },
  {
    key: "telephoneCorporate",
    label: "Téléphone entreprise",
    csvKeys: ["corporate_phone", "company_phone", "work_phone"],
  },
  {
    key: "telephoneDirect",
    label: "Ligne directe",
    csvKeys: ["work_direct_phone", "direct_phone", "direct_dial"],
  },
  { key: "ville", label: "Ville", csvKeys: ["city", "contact_city"] },
  { key: "region", label: "Région / État", csvKeys: ["state", "contact_state"] },
  { key: "pays", label: "Pays", csvKeys: ["country", "contact_country"] },
  { key: "seniorite", label: "Séniorité", csvKeys: ["seniority"] },
  { key: "departements", label: "Départements", csvKeys: ["departments", "department"] },
  { key: "twitter", label: "Twitter / X", csvKeys: ["twitter_url", "twitter"] },
  { key: "facebook", label: "Facebook", csvKeys: ["facebook_url", "facebook"] },
  { key: "github", label: "GitHub", csvKeys: ["github_url", "github"] },
  {
    key: "siteWeb",
    label: "Site web",
    csvKeys: ["website", "company_website", "account_website", "domain"],
  },
  {
    key: "linkedinEntreprise",
    label: "LinkedIn entreprise",
    csvKeys: [
      "company_linkedin_url",
      "account_linkedin_url",
      "organization_linkedin_url",
    ],
  },
  {
    key: "effectifs",
    label: "Effectifs",
    csvKeys: ["employees", "employee_count", "num_employees", "number_of_employees", "# employees"],
  },
  { key: "motsCles", label: "Mots-clés", csvKeys: ["keywords", "company_keywords"] },
  {
    key: "technologies",
    label: "Technologies",
    csvKeys: ["technologies", "technologies_used", "tech_stack"],
  },
  {
    key: "chiffreAffaires",
    label: "Chiffre d'affaires",
    csvKeys: ["annual_revenue", "revenue", "company_annual_revenue"],
  },
  {
    key: "anneeFondation",
    label: "Année de fondation",
    csvKeys: ["founded_year", "year_founded", "company_founded_year"],
  },
  {
    key: "adresseEntreprise",
    label: "Adresse entreprise",
    csvKeys: ["company_address", "account_address", "street_address"],
  },
  {
    key: "villeEntreprise",
    label: "Ville entreprise",
    csvKeys: ["company_city", "account_city"],
  },
  {
    key: "regionEntreprise",
    label: "Région entreprise",
    csvKeys: ["company_state", "account_state"],
  },
  {
    key: "paysEntreprise",
    label: "Pays entreprise",
    csvKeys: ["company_country", "account_country"],
  },
  {
    key: "codePostalEntreprise",
    label: "Code postal entreprise",
    csvKeys: ["company_postal_code", "postal_code", "zip", "zip_code"],
  },
  {
    key: "telephoneEntreprise",
    label: "Téléphone siège",
    csvKeys: ["company_phone_number", "account_phone"],
  },
  {
    key: "entreprisePourEmails",
    label: "Entreprise (e-mails)",
    csvKeys: ["company_name_for_emails"],
  },
  {
    key: "apolloContactId",
    label: "ID contact Apollo",
    csvKeys: ["apollo_contact_id", "contact_id", "apollo_id"],
  },
  {
    key: "apolloAccountId",
    label: "ID compte Apollo",
    csvKeys: ["apollo_account_id", "account_id", "company_id"],
  },
  {
    key: "etapeApollo",
    label: "Étape Apollo",
    csvKeys: ["stage", "contact_stage", "apollo_stage"],
  },
  {
    key: "proprietaireApollo",
    label: "Propriétaire Apollo",
    csvKeys: ["contact_owner", "owner", "account_owner"],
  },
] as const satisfies ReadonlyArray<{
  key: keyof ProspectInsertFields;
  label: string;
  csvKeys: readonly string[];
}>;

export type ApolloProspectFieldKey = (typeof APOLLO_PROSPECT_FIELD_DEFS)[number]["key"];

export const APOLLO_PROSPECT_FIELD_KEYS = APOLLO_PROSPECT_FIELD_DEFS.map(
  (f) => f.key,
) as ApolloProspectFieldKey[];

export const APOLLO_PROSPECT_FIELD_LABELS: Record<ApolloProspectFieldKey, string> =
  Object.fromEntries(APOLLO_PROSPECT_FIELD_DEFS.map((f) => [f.key, f.label])) as Record<
    ApolloProspectFieldKey,
    string
  >;

function pickFirst(row: Record<string, string>, keys: readonly string[]): string | undefined {
  for (const k of keys) {
    const v = row[k];
    if (v?.trim()) return v.trim();
  }
  return undefined;
}

/** Mappe une ligne CSV Apollo normalisée vers les champs prospect (core + Apollo). */
export function mapApolloRowToProspectFields(
  rawRow: Record<string, string>,
): ProspectInsertFields {
  const r = normalizeImportRowKeys(rawRow);

  const email = pickFirst(r, [
    "contact_email",
    "email",
    "primary_email",
    "work_email",
    "personal_email",
    "e_mail",
    "mail",
  ]);
  const emailSecondaire =
    pickFirst(r, ["secondary_email", "alternate_email", "other_email"]) ??
    (() => {
      const emails = [
        r.contact_email,
        r.email,
        r.primary_email,
        r.work_email,
        r.personal_email,
      ].filter((v): v is string => Boolean(v?.trim()));
      const uniq = [...new Set(emails.map((e) => e.trim()))];
      return uniq.length > 1 ? uniq[1] : undefined;
    })();

  const telephoneMobile = pickFirst(r, ["mobile_phone", "cell_phone"]);
  const telephoneCorporate = pickFirst(r, ["corporate_phone", "work_phone"]);
  const telephoneDirect = pickFirst(r, ["work_direct_phone", "direct_phone", "direct_dial"]);
  const telephone =
    telephoneMobile ??
    telephoneCorporate ??
    telephoneDirect ??
    pickFirst(r, ["home_phone", "phone", "telephone", "tel"]);

  const linkedin = pickFirst(r, [
    "person_linkedin_url",
    "contact_linkedin_url",
    "linkedin_url",
    "linkedin",
    "linkedin_profile",
  ]);

  const entreprise = pickFirst(r, [
    "company_name",
    "company",
    "organization",
    "account_name",
    "primary_company_name",
    "entreprise",
  ]);

  const secteur = pickFirst(r, ["industry", "company_industry", "sector", "secteur"]);

  const apolloFields = Object.fromEntries(
    APOLLO_PROSPECT_FIELD_DEFS.map(({ key, csvKeys }) => [key, pickFirst(r, csvKeys)]),
  ) as Pick<ProspectInsertFields, ApolloProspectFieldKey>;

  return normalizeProspectPhoneFields({
    nom: pickFirst(r, ["last_name", "lastname", "nom", "name"]) ?? "?",
    prenom: pickFirst(r, ["first_name", "firstname", "prenom"]),
    email,
    emailSecondaire,
    telephone,
    telephoneMobile,
    telephoneCorporate,
    telephoneDirect,
    linkedin,
    entreprise,
    secteur,
    source: pickFirst(r, ["source"]) ?? "apollo",
    notes: pickFirst(r, ["notes", "note", "comment"]),
    pays: pickFirst(r, ["country", "contact_country", "pays"]),
    paysEntreprise: pickFirst(r, ["company_country", "account_country", "pays_entreprise"]),
    ...apolloFields,
  });
}

/** Champs texte éditables via API (fiche + Apollo). */
export const PROSPECT_EDITABLE_STRING_KEYS = [
  "nom",
  "prenom",
  "email",
  "emailSecondaire",
  "telephone",
  "telephoneMobile",
  "telephoneCorporate",
  "telephoneDirect",
  "linkedin",
  "entreprise",
  "entreprisePourEmails",
  "secteur",
  "source",
  "notes",
  ...APOLLO_PROSPECT_FIELD_KEYS,
] as const;

export type ProspectEditableStringKey = (typeof PROSPECT_EDITABLE_STRING_KEYS)[number];

export function prospectStringFieldsFromBody(
  body: Record<string, unknown>,
): Partial<ProspectInsertFields> {
  const out: Partial<ProspectInsertFields> = {};
  for (const key of PROSPECT_EDITABLE_STRING_KEYS) {
    if (typeof body[key] === "string") {
      const trimmed = body[key].trim();
      (out as Record<string, string | undefined>)[key] = trimmed || undefined;
    }
  }
  return normalizeProspectPhoneFields(out);
}
