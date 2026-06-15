import { sql } from "drizzle-orm";
import { boolean, check, index, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "../auth/user";
import { agendaSchema } from "../schemas";
import { AGENDA_EVENT_STATUSES, AGENDA_POLE_SQL, type AgendaEventStatus, type AgendaPole } from "./poles";
import { agendaEventType } from "./event-type";

export const agendaEvent = agendaSchema.table(
  "event",
  {
    id: text("id").primaryKey(),
    reference: text("reference").notNull(),
    pole: text("pole").$type<AgendaPole>().notNull(),
    typeId: text("type_id")
      .notNull()
      .references(() => agendaEventType.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    status: text("status").$type<AgendaEventStatus>().notNull().default("draft"),
    startsAt: timestamp("starts_at").notNull(),
    endsAt: timestamp("ends_at").notNull(),
    allDay: boolean("all_day").notNull().default(false),
    timezone: text("timezone"),
    location: text("location"),
    meetUrl: text("meet_url"),
    driveUrl: text("drive_url"),
    /** Lien optionnel vers une mission CCA (jalons auto). */
    missionId: text("mission_id"),
    /** Type de jalon mission : mission_start, mission_end, bc_planning_start, bc_planning_end, rmi_meeting */
    milestoneKind: text("milestone_kind"),
    /** BC lié pour jalons planning / RMI */
    missionBcId: text("mission_bc_id"),
    recurrenceRule: text("recurrence_rule"),
    recurrenceParentId: text("recurrence_parent_id"),
    googleCalendarId: text("google_calendar_id"),
    googleEventId: text("google_event_id"),
    syncStatus: text("sync_status"),
    lastSyncedAt: timestamp("last_synced_at"),
    source: text("source").notNull().default("app"),
    createdByUserId: text("created_by_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    updatedByUserId: text("updated_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    uniqueIndex("event_reference_unique").on(t.reference),
    index("event_pole_starts_idx").on(t.pole, t.startsAt),
    index("event_status_starts_idx").on(t.status, t.startsAt),
    index("event_created_by_idx").on(t.createdByUserId),
    index("event_recurrence_parent_idx").on(t.recurrenceParentId),
    check("event_pole_check", sql`${t.pole} IN (${sql.raw(AGENDA_POLE_SQL)})`),
    check(
      "event_status_check",
      sql`${t.status} IN (${sql.raw(AGENDA_EVENT_STATUSES.map((s) => `'${s}'`).join(", "))})`,
    ),
  ],
);
