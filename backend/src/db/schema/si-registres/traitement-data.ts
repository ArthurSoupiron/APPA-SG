import { index, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { siRegistresSchema } from "../schemas";

export const traitementData = siRegistresSchema.table(
  "traitement_data",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    nomTraitement: text("nom_traitement").notNull(),
    reference: text("reference").notNull(),
    descriptionFinalite: text("description_finalite"),
    dateCreationFiche: timestamp("date_creation_fiche"),
    dateMiseAJourFiche: timestamp("date_mise_a_jour_fiche"),
    driveFolderUrl: text("drive_folder_url"),
    fichePdfUrl: text("fiche_pdf_url"),
    preuveConsentementUrl: text("preuve_consentement_url"),
    preuveMentionsUrl: text("preuve_mentions_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("traitement_data_user_id_idx").on(t.userId)],
);
