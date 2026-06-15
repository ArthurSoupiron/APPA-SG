import { sql } from "drizzle-orm";
import { check, index, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { agendaSchema } from "../schemas";
import { agendaEvent } from "./event";
import {
  AGENDA_PARTICIPANT_ROLES,
  AGENDA_RSVP_STATUSES,
  type AgendaParticipantRole,
  type AgendaRsvpStatus,
} from "./poles";

export const agendaEventParticipant = agendaSchema.table(
  "event_participant",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id")
      .notNull()
      .references(() => agendaEvent.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    email: text("email").notNull(),
    displayName: text("display_name"),
    rsvpStatus: text("rsvp_status").$type<AgendaRsvpStatus>().notNull().default("pending"),
    role: text("role").$type<AgendaParticipantRole>().notNull().default("attendee"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    uniqueIndex("event_participant_event_email_unique").on(t.eventId, t.email),
    index("event_participant_event_idx").on(t.eventId),
    index("event_participant_user_idx").on(t.userId),
    check(
      "event_participant_rsvp_check",
      sql`${t.rsvpStatus} IN (${sql.raw(AGENDA_RSVP_STATUSES.map((s) => `'${s}'`).join(", "))})`,
    ),
    check(
      "event_participant_role_check",
      sql`${t.role} IN (${sql.raw(AGENDA_PARTICIPANT_ROLES.map((r) => `'${r}'`).join(", "))})`,
    ),
  ],
);
