import { index, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { siSchema } from "../schemas";
import { ticket } from "./ticket";

export const ticketWatcher = siSchema.table(
  "ticket_watcher",
  {
    ticketId: text("ticket_id")
      .notNull()
      .references(() => ticket.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.ticketId, t.userId] }),
    index("ticket_watcher_user_idx").on(t.userId),
  ],
);
