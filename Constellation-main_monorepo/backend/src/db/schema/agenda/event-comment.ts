import { index, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { agendaSchema } from "../schemas";
import { agendaEvent } from "./event";

export const agendaEventComment = agendaSchema.table(
  "event_comment",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id")
      .notNull()
      .references(() => agendaEvent.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("event_comment_event_idx").on(t.eventId, t.createdAt),
    index("event_comment_user_idx").on(t.userId),
  ],
);
