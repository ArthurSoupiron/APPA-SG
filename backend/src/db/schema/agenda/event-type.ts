import { sql } from "drizzle-orm";
import { boolean, check, index, integer, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { agendaSchema } from "../schemas";
import { AGENDA_POLE_SQL, type AgendaPole } from "./poles";

export const agendaEventType = agendaSchema.table(
  "event_type",
  {
    id: text("id").primaryKey(),
    pole: text("pole").$type<AgendaPole>().notNull(),
    slug: text("slug").notNull(),
    label: text("label").notNull(),
    color: text("color"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    uniqueIndex("event_type_pole_slug_unique").on(t.pole, t.slug),
    index("event_type_pole_active_idx").on(t.pole, t.isActive),
    check("event_type_pole_check", sql`${t.pole} IN (${sql.raw(AGENDA_POLE_SQL)})`),
  ],
);
