import { boolean, index, integer, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { siRegistresSchema } from "../schemas";

export const registreLicences = siRegistresSchema.table(
  "registre_licences",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    anneeCivile: integer("annee_civile").notNull(),
    nom: text("nom").notNull(),
    driveFolderUrl: text("drive_folder_url"),
    dateFacturation: timestamp("date_facturation"),
    utilisationCommerciale: boolean("utilisation_commerciale").default(false),
    licenceCommercialeUrl: text("licence_commerciale_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("registre_licences_user_id_idx").on(t.userId),
    index("registre_licences_annee_civile_idx").on(t.anneeCivile),
  ],
);
