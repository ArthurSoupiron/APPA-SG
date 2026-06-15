import { text, timestamp } from "drizzle-orm/pg-core";

import { assocSchema } from "../schemas";

/** Échéance réglementaire (AG, assurance, dépôt des comptes, etc.). */
export const assocDeadline = assocSchema.table("deadline", {
  id: text("id").primaryKey(),
  date: text("date").notNull(), // ISO yyyy-mm-dd
  title: text("title").notNull(),
  sub: text("sub").notNull().default(""),
  kind: text("kind").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
