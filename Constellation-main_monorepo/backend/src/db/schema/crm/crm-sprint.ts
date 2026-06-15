import { boolean, index, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { crmSchema } from "../schemas";

export const crmSprint = crmSchema.table(
  "crm_sprint",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    theme: text("theme"),
    dateStart: timestamp("date_start").notNull(),
    dateEnd: timestamp("date_end").notNull(),
    isPublic: boolean("is_public").notNull().default(false),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("crm_sprint_created_by_idx").on(t.createdBy),
    index("crm_sprint_dates_idx").on(t.dateStart, t.dateEnd),
  ],
);
