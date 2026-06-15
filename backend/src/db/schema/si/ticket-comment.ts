import { index, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { siSchema } from "../schemas";
import { ticket } from "./ticket";

export const ticketComment = siSchema.table(
  "ticket_comment",
  {
    id: text("id").primaryKey(),
    ticketId: text("ticket_id")
      .notNull()
      .references(() => ticket.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("ticket_comment_ticket_idx").on(t.ticketId, t.createdAt),
    index("ticket_comment_user_idx").on(t.userId),
  ],
);
