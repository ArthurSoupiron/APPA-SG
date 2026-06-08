import { index, jsonb, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { agendaSchema } from "../schemas";
import { agendaEvent } from "./event";

export const agendaEventNotification = agendaSchema.table(
  "event_notification",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    eventId: text("event_id")
      .notNull()
      .references(() => agendaEvent.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown> | null>(),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("event_notification_user_read_idx").on(t.userId, t.readAt),
    index("event_notification_event_idx").on(t.eventId),
  ],
);
