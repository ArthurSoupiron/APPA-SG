import { boolean, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { missionSchema } from "../schemas";
import { missionBonCommande } from "./bon-commande";

export const missionPvrf = missionSchema.table("mission_pvrf", {
  id: text("id").primaryKey(),
  bcId: text("bc_id")
    .notNull()
    .references(() => missionBonCommande.id, { onDelete: "cascade" }),
  pvrfNumber: text("pvrf_number").notNull(),
  generatedFileId: text("generated_file_id"),
  receptionDate: timestamp("reception_date"),
  validatedBy: text("validated_by").references(() => user.id, { onDelete: "set null" }),
  clientValidated: boolean("client_validated").notNull().default(false),
  entrepriseValidated: boolean("entreprise_validated").notNull().default(false),
  validationDate: timestamp("validation_date"),
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
