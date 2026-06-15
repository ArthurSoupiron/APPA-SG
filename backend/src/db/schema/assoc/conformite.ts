import { text, timestamp } from "drizzle-orm/pg-core";

import { assocSchema } from "../schemas";

/** Point de la checklist de conformité associative. */
export const assocConformiteCheck = assocSchema.table("conformite_check", {
  id: text("id").primaryKey(),
  k: text("k").notNull(),
  s: text("s").notNull().default(""),
  state: text("state").notNull().default("todo"), // ok | pending | todo
  ref: text("ref"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
