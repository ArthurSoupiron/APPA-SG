import { index, integer, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { siRegistresSchema } from "../schemas";

import { traitementData } from "./traitement-data";

export const registreBdd = siRegistresSchema.table(
  "registre_bdd",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    anneeCivile: integer("annee_civile").notNull(),
    nom: text("nom").notNull(),
    driveFolderUrl: text("drive_folder_url"),
    traitementDataId: text("traitement_data_id").references(() => traitementData.id, {
      onDelete: "set null",
    }),
    sheetExcelUrl: text("sheet_excel_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("registre_bdd_user_id_idx").on(t.userId),
    index("registre_bdd_traitement_data_id_idx").on(t.traitementDataId),
  ],
);
