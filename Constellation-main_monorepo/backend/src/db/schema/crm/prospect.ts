import { index, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { crmSchema } from "../schemas";

export const PROSPECT_STATUSES = [
  "a_contacter",
  "a_recontacter",
  "contacte",
  "rdv_confirme",
  "en_cours",
  "transforme",
  "perdu",
] as const;
export type ProspectStatus = (typeof PROSPECT_STATUSES)[number];

export const prospect = crmSchema.table(
  "prospect",
  {
    id: text("id").primaryKey(),
    nom: text("nom").notNull(),
    prenom: text("prenom"),
    email: text("email"),
    telephone: text("telephone"),
    linkedin: text("linkedin"),
    entreprise: text("entreprise"),
    secteur: text("secteur"),
    source: text("source"),
    statut: text("statut").notNull().default("a_contacter"),
    notes: text("notes"),
    /** --- Enrichissement Apollo (export People CSV) --- */
    titre: text("titre"),
    emailStatut: text("email_statut"),
    emailSecondaire: text("email_secondaire"),
    telephoneMobile: text("telephone_mobile"),
    telephoneCorporate: text("telephone_corporate"),
    telephoneDirect: text("telephone_direct"),
    ville: text("ville"),
    region: text("region"),
    pays: text("pays"),
    seniorite: text("seniorite"),
    departements: text("departements"),
    twitter: text("twitter"),
    facebook: text("facebook"),
    github: text("github"),
    siteWeb: text("site_web"),
    linkedinEntreprise: text("linkedin_entreprise"),
    effectifs: text("effectifs"),
    motsCles: text("mots_cles"),
    technologies: text("technologies"),
    chiffreAffaires: text("chiffre_affaires"),
    anneeFondation: text("annee_fondation"),
    adresseEntreprise: text("adresse_entreprise"),
    villeEntreprise: text("ville_entreprise"),
    regionEntreprise: text("region_entreprise"),
    paysEntreprise: text("pays_entreprise"),
    codePostalEntreprise: text("code_postal_entreprise"),
    telephoneEntreprise: text("telephone_entreprise"),
    entreprisePourEmails: text("entreprise_pour_emails"),
    apolloContactId: text("apollo_contact_id"),
    apolloAccountId: text("apollo_account_id"),
    etapeApollo: text("etape_apollo"),
    proprietaireApollo: text("proprietaire_apollo"),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("prospect_statut_idx").on(t.statut),
    index("prospect_created_by_idx").on(t.createdBy),
    index("prospect_updated_at_idx").on(t.updatedAt),
  ],
);
