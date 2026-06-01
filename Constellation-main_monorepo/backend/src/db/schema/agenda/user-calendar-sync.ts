import { boolean, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { agendaSchema } from "../schemas";

export const agendaUserCalendarSync = agendaSchema.table(
  "user_calendar_sync",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    googleCalendarId: text("google_calendar_id"),
    syncToken: text("sync_token"),
    enabled: boolean("enabled").notNull().default(false),
    lastSyncAt: timestamp("last_sync_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [uniqueIndex("user_calendar_sync_user_unique").on(t.userId)],
);
