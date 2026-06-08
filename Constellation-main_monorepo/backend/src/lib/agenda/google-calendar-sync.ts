import { eq } from "drizzle-orm";
import { google } from "googleapis";

import { db } from "../../db";
import {
  agendaEvent,
  agendaEventAudience,
  agendaUserCalendarSync,
  type AgendaEventStatus,
} from "../../db/schema";
import { getGoogleOAuthForUser } from "../google-account-auth";
import { scopeIncludesCalendar } from "../google-oauth-scopes";
import { getAgendaEnv } from "./agenda-env";
import { loadGoogleAttendeeEmailsForEvent } from "./google-calendar-attendees";
import { recordAgendaChange } from "./event-change-log";

async function eventToGoogleBody(e: typeof agendaEvent.$inferSelect) {
  const attendeeEmails = await loadGoogleAttendeeEmailsForEvent(e.id);
  return {
    summary: e.title,
    description: e.description || undefined,
    location: e.location || undefined,
    start: e.allDay
      ? { date: e.startsAt.toISOString().slice(0, 10) }
      : { dateTime: e.startsAt.toISOString() },
    end: e.allDay
      ? { date: e.endsAt.toISOString().slice(0, 10) }
      : { dateTime: e.endsAt.toISOString() },
    attendees: attendeeEmails.map((email) => ({ email })),
    source: {
      title: "JaegerMyster Agenda",
      url: getAgendaEnv().appBaseUrl ? `${getAgendaEnv().appBaseUrl}/account/agenda?event=${e.id}` : undefined,
    },
  };
}

/** Événement éligible au push Google : publié, audience mandat, non supprimé. */
export async function shouldSyncEventToGoogle(eventId: string): Promise<boolean> {
  if (!getAgendaEnv().googleSyncEnabled) return false;
  const [e] = await db.select().from(agendaEvent).where(eq(agendaEvent.id, eventId)).limit(1);
  if (!e || e.deletedAt || e.status !== "published") return false;
  const audiences = await db
    .select()
    .from(agendaEventAudience)
    .where(eq(agendaEventAudience.eventId, eventId));
  return audiences.some((a) => a.audience === "mandat");
}

type AgendaGoogleEventRef = {
  googleEventId: string | null;
  googleCalendarId: string | null;
  createdByUserId: string;
};

/** Supprime l’événement lié sur Google Calendar (compte du créateur). */
export async function deleteGoogleCalendarEvent(
  event: AgendaGoogleEventRef,
): Promise<{ ok: boolean; message?: string }> {
  if (!event.googleEventId) return { ok: true };

  const authRes = await getGoogleOAuthForUser(event.createdByUserId, {
    driveRead: false,
    driveWrite: false,
    spreadsheets: false,
  });
  if (!authRes.ok) return { ok: false, message: authRes.message };
  if (!scopeIncludesCalendar(authRes.scope)) {
    return { ok: false, message: "Scope Google Calendar manquant sur le compte créateur." };
  }

  const calendar = google.calendar({ version: "v3", auth: authRes.auth });
  const calendarId = event.googleCalendarId ?? "primary";

  try {
    await calendar.events.delete({
      calendarId,
      eventId: event.googleEventId,
      sendUpdates: "all",
    });
    return { ok: true };
  } catch (err) {
    const status =
      err && typeof err === "object" && "code" in err ? Number((err as { code?: number }).code) : 0;
    if (status === 404 || status === 410) return { ok: true };
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, message: `Échec suppression Google Calendar : ${message}` };
  }
}

export async function pushEventToUserGoogleCalendar(
  userId: string,
  eventId: string,
): Promise<void> {
  if (!(await shouldSyncEventToGoogle(eventId))) return;

  const [syncRow] = await db
    .select()
    .from(agendaUserCalendarSync)
    .where(eq(agendaUserCalendarSync.userId, userId))
    .limit(1);
  if (!syncRow?.enabled) return;

  const authRes = await getGoogleOAuthForUser(userId, {
    driveRead: false,
    driveWrite: false,
    spreadsheets: false,
  });
  if (!authRes.ok || !scopeIncludesCalendar(authRes.scope)) return;

  const [e] = await db.select().from(agendaEvent).where(eq(agendaEvent.id, eventId)).limit(1);
  if (!e) return;

  const calendar = google.calendar({ version: "v3", auth: authRes.auth });
  const calendarId = syncRow.googleCalendarId ?? "primary";
  const body = await eventToGoogleBody(e);
  const sendUpdates = body.attendees && body.attendees.length > 0 ? "all" : "none";

  try {
    if (e.googleEventId) {
      await calendar.events.update({
        calendarId,
        eventId: e.googleEventId,
        sendUpdates,
        requestBody: body,
      });
    } else {
      const res = await calendar.events.insert({
        calendarId,
        sendUpdates,
        requestBody: body,
      });
      if (res.data.id) {
        await db
          .update(agendaEvent)
          .set({
            googleEventId: res.data.id,
            googleCalendarId: calendarId,
            syncStatus: "synced",
            lastSyncedAt: new Date(),
          })
          .where(eq(agendaEvent.id, eventId));
      }
    }
    await recordAgendaChange(eventId, userId, "synced", { direction: "export" });
  } catch (err) {
    await db
      .update(agendaEvent)
      .set({ syncStatus: "error" })
      .where(eq(agendaEvent.id, eventId));
    console.error("[agenda-google-sync] push failed:", err);
  }
}

export async function setUserCalendarSyncEnabled(
  userId: string,
  enabled: boolean,
  googleCalendarId?: string,
) {
  await db
    .insert(agendaUserCalendarSync)
    .values({
      userId,
      enabled,
      googleCalendarId: googleCalendarId ?? "primary",
    })
    .onConflictDoUpdate({
      target: agendaUserCalendarSync.userId,
      set: {
        enabled,
        googleCalendarId: googleCalendarId ?? "primary",
        updatedAt: new Date(),
      },
    });
}

export async function syncPublishedMandatEventsForUser(userId: string): Promise<void> {
  if (!getAgendaEnv().googleSyncEnabled) return;
  const published = await db
    .select({ id: agendaEvent.id })
    .from(agendaEvent)
    .where(eq(agendaEvent.status, "published" as AgendaEventStatus));

  for (const row of published) {
    if (await shouldSyncEventToGoogle(row.id)) {
      await pushEventToUserGoogleCalendar(userId, row.id);
    }
  }
}
