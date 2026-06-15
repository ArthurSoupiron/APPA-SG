import { index, text, timestamp } from "drizzle-orm/pg-core";

import { prospect } from "../crm/prospect";
import { missionSchema } from "../schemas";

export const commercialEntreprise = missionSchema.table(
  "commercial_entreprises",
  {
    id: text("id").primaryKey(),
    nomEntreprise: text("nom_entreprise").notNull(),
    telephoneEntreprise: text("telephone_entreprise").notNull().default(""),
    mailEntreprise: text("mail_entreprise").notNull().default(""),
    paysEntreprise: text("pays_entreprise").notNull().default("France"),
    adresseEntreprise: text("adresse_entreprise").notNull().default(""),
    villeEntreprise: text("ville_entreprise").notNull().default(""),
    codePostalEntreprise: text("code_postal_entreprise").notNull().default(""),
    sirenEntreprise: text("siren_entreprise"),
    prospectId: text("prospect_id").references(() => prospect.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("commercial_entreprises_prospect_idx").on(t.prospectId),
    index("commercial_entreprises_nom_idx").on(t.nomEntreprise),
  ],
);
