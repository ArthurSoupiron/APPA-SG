import { asc, eq, isNull } from "drizzle-orm";
import { google } from "googleapis";

import { db } from "../../db";
import {
  agendaEvent,
  agendaEventAudience,
  agendaEventComment,
  agendaEventParticipant,
  agendaEventType,
} from "../../db/schema";
import { getGoogleOAuthForUser } from "../google-account-auth";
import { sheetAppendRange } from "../google-sheet-range";
import { getAgendaEnv } from "./agenda-env";

export const AGENDA_SHEET_HEADERS = [
  "event_id",
  "reference",
  "pole",
  "type_label",
  "type_id",
  "title",
  "status",
  "starts_at",
  "ends_at",
  "duration_minutes",
  "all_day",
  "is_recurring",
  "recurrence_rule",
  "audiences",
  "has_mandat",
  "has_intervenants",
  "has_externes",
  "participant_count",
  "accepted_count",
  "declined_count",
  "external_invite_count",
  "created_by_id",
  "updated_by_id",
  "google_event_id",
  "sync_status",
  "source",
  "comment_count",
  "created_at",
  "updated_at",
  "deleted_at",
  "exported_at",
] as const;

const TAB = "Agenda_Events";

async function ensureTab(sheets: ReturnType<typeof google.sheets>, spreadsheetId: string) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const titles = new Set(
    (meta.data.sheets ?? []).map((s) => s.properties?.title).filter(Boolean) as string[],
  );
  if (titles.has(TAB)) return;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{ addSheet: { properties: { title: TAB } } }],
    },
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${TAB}!A1`,
    valueInputOption: "RAW",
    requestBody: { values: [[...AGENDA_SHEET_HEADERS]] },
  });
}

export async function exportAgendaEventsToSheet(actorUserId: string): Promise<{ ok: boolean; message?: string }> {
  const sheetId = getAgendaEnv().sheetId;
  if (!sheetId) {
    return { ok: false, message: "AGENDA_SHEET_ID non configuré." };
  }

  const authRes = await getGoogleOAuthForUser(actorUserId, {
    driveRead: false,
    driveWrite: false,
    spreadsheets: true,
  });
  if (!authRes.ok) return { ok: false, message: authRes.message };

  const sheets = google.sheets({ version: "v4", auth: authRes.auth });
  await ensureTab(sheets, sheetId);

  const events = await db
    .select()
    .from(agendaEvent)
    .where(isNull(agendaEvent.deletedAt))
    .orderBy(asc(agendaEvent.startsAt));

  const now = new Date().toISOString();
  const rows: string[][] = [];

  for (const e of events) {
    const [audiences, participants, comments, typeRow] = await Promise.all([
      db.select().from(agendaEventAudience).where(eq(agendaEventAudience.eventId, e.id)),
      db.select().from(agendaEventParticipant).where(eq(agendaEventParticipant.eventId, e.id)),
      db.select().from(agendaEventComment).where(eq(agendaEventComment.eventId, e.id)),
      db.select().from(agendaEventType).where(eq(agendaEventType.id, e.typeId)).limit(1),
    ]);
    const aud = audiences.map((a) => a.audience);
    const durationMin = Math.round((e.endsAt.getTime() - e.startsAt.getTime()) / 60_000);
    const domain = (process.env.AGENDA_MANDAT_EMAIL_DOMAIN ?? "jeece.fr").toLowerCase();
    const externalCount = participants.filter(
      (p) => !p.email.toLowerCase().endsWith(`@${domain}`),
    ).length;

    rows.push([
      e.id,
      e.reference,
      e.pole,
      typeRow[0]?.label ?? "",
      e.typeId,
      e.title,
      e.status,
      e.startsAt.toISOString(),
      e.endsAt.toISOString(),
      String(durationMin),
      e.allDay ? "true" : "false",
      e.recurrenceRule ? "true" : "false",
      e.recurrenceRule ?? "",
      aud.join(","),
      aud.includes("mandat") ? "true" : "false",
      aud.includes("intervenants") ? "true" : "false",
      aud.includes("externes") ? "true" : "false",
      String(participants.length),
      String(participants.filter((p) => p.rsvpStatus === "accepted").length),
      String(participants.filter((p) => p.rsvpStatus === "declined").length),
      String(externalCount),
      e.createdByUserId,
      e.updatedByUserId ?? "",
      e.googleEventId ?? "",
      e.syncStatus ?? "",
      e.source,
      String(comments.length),
      e.createdAt.toISOString(),
      e.updatedAt.toISOString(),
      e.deletedAt?.toISOString() ?? "",
      now,
    ]);
  }

  if (rows.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: sheetAppendRange(TAB, AGENDA_SHEET_HEADERS.length),
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: rows },
    });
  }

  return { ok: true };
}
