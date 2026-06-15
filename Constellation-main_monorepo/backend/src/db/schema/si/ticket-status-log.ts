import { index, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { siSchema } from "../schemas";
import { ticket } from "./ticket";

export const ticketStatusLog = siSchema.table(
  "ticket_status_log",
  {
    id: text("id").primaryKey(),
    ticketId: text("ticket_id")
      .notNull()
      .references(() => ticket.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    fromStatus: text("from_status"),
    toStatus: text("to_status").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("ticket_status_log_ticket_idx").on(t.ticketId, t.createdAt),
    index("ticket_status_log_user_idx").on(t.userId),
  ],
);
