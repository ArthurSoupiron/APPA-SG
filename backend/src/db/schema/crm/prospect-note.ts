import { index, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { crmSchema } from "../schemas";
import { prospect } from "./prospect";

export const prospectNote = crmSchema.table(
  "prospect_note",
  {
    id: text("id").primaryKey(),
    prospectId: text("prospect_id")
      .notNull()
      .references(() => prospect.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("prospect_note_prospect_created_idx").on(t.prospectId, t.createdAt),
    index("prospect_note_user_idx").on(t.userId),
  ],
);
