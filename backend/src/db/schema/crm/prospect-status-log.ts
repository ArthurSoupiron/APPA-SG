import { index, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { crmSchema } from "../schemas";
import { prospect } from "./prospect";

export const prospectStatusLog = crmSchema.table(
  "prospect_status_log",
  {
    id: text("id").primaryKey(),
    prospectId: text("prospect_id")
      .notNull()
      .references(() => prospect.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    oldStatus: text("old_status"),
    newStatus: text("new_status").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("psl_prospect_idx").on(t.prospectId),
    index("psl_user_idx").on(t.userId),
    index("psl_created_at_idx").on(t.createdAt),
  ],
);
