import { primaryKey, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { crmSchema } from "../schemas";
import { crmSprint } from "./crm-sprint";

export const sprintMember = crmSchema.table(
  "sprint_member",
  {
    sprintId: text("sprint_id")
      .notNull()
      .references(() => crmSprint.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.sprintId, t.userId] })],
);
