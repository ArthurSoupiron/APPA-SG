import { index, jsonb, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { siSchema } from "../schemas";
import { ticket } from "./ticket";

export const ticketNotification = siSchema.table(
  "ticket_notification",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ticketId: text("ticket_id")
      .notNull()
      .references(() => ticket.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown> | null>(),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("ticket_notification_user_read_idx").on(t.userId, t.readAt),
    index("ticket_notification_ticket_idx").on(t.ticketId),
  ],
);
