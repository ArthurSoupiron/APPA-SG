import { sql } from "drizzle-orm";
import { check, index, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

import { agendaSchema } from "../schemas";
import { agendaEvent } from "./event";
import { AGENDA_AUDIENCE_SQL, type AgendaAudience } from "./poles";

export const agendaEventAudience = agendaSchema.table(
  "event_audience",
  {
    eventId: text("event_id")
      .notNull()
      .references(() => agendaEvent.id, { onDelete: "cascade" }),
    audience: text("audience").$type<AgendaAudience>().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.eventId, t.audience] }),
    index("event_audience_audience_idx").on(t.audience),
    check("event_audience_check", sql`${t.audience} IN (${sql.raw(AGENDA_AUDIENCE_SQL)})`),
  ],
);
