import { index, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { crmSchema } from "../schemas";
import { crmSprint } from "./crm-sprint";
import { prospect } from "./prospect";

export const sprintProspect = crmSchema.table(
  "sprint_prospect",
  {
    sprintId: text("sprint_id")
      .notNull()
      .references(() => crmSprint.id, { onDelete: "cascade" }),
    prospectId: text("prospect_id")
      .notNull()
      .references(() => prospect.id, { onDelete: "cascade" }),
    assignedUserId: text("assigned_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    addedAt: timestamp("added_at").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.sprintId, t.prospectId] }),
    index("sprint_prospect_sprint_idx").on(t.sprintId),
    index("sprint_prospect_user_idx").on(t.assignedUserId),
  ],
);
