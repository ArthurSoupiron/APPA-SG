import { index, jsonb, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { agendaSchema } from "../schemas";
import { agendaEvent } from "./event";

export const agendaEventChangeLog = agendaSchema.table(
  "event_change_log",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id")
      .notNull()
      .references(() => agendaEvent.id, { onDelete: "cascade" }),
    actorUserId: text("actor_user_id").references(() => user.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("event_change_log_event_idx").on(t.eventId, t.createdAt),
    index("event_change_log_action_idx").on(t.action),
  ],
);
