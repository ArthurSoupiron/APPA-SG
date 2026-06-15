import { text, timestamp } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { missionSchema } from "../schemas";
import { missionBonCommande } from "./bon-commande";

export const missionQs = missionSchema.table("mission_qs", {
  id: text("id").primaryKey(),
  bcId: text("bc_id")
    .notNull()
    .references(() => missionBonCommande.id, { onDelete: "cascade" }),
  qsNumber: text("qs_number").notNull(),
  generatedFileId: text("generated_file_id"),
  validationDate: timestamp("validation_date"),
  validatedBy: text("validated_by").references(() => user.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
  updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
