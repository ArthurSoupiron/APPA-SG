import { index, integer, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { siRegistresSchema } from "../schemas";

export const registreRgpd = siRegistresSchema.table(
  "registre_rgpd",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    anneeCivile: integer("annee_civile").notNull(),
    nom: text("nom").notNull(),
    driveFolderUrl: text("drive_folder_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("registre_rgpd_user_id_idx").on(t.userId),
    index("registre_rgpd_annee_civile_idx").on(t.anneeCivile),
  ],
);
