import { boolean, decimal, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { missionSchema } from "../schemas";
import { missionBonCommande } from "./bon-commande";

export const missionFa = missionSchema.table("mission_fa", {
  id: text("id").primaryKey(),
  bcId: text("bc_id")
    .notNull()
    .references(() => missionBonCommande.id, { onDelete: "cascade" }),
  faNumber: text("fa_number").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  currency: text("currency").default("EUR"),
  issueDate: timestamp("issue_date"),
  dueDate: timestamp("due_date"),
  regle: boolean("regle").notNull().default(false),
  regleAt: timestamp("regle_at"),
  generatedFileId: text("generated_file_id"),
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
