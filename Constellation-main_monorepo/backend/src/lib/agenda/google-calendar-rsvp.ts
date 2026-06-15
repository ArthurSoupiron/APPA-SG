import { and, eq, sql } from "drizzle-orm";
import type { calendar_v3 } from "googleapis";
import { google } from "googleapis";

import { db } from "../../db";
import { agendaEvent, agendaEventParticipant } from "../../db/schema";
import type { AgendaRsvpStatus } from "../../db/schema/agenda/poles";
import { getGoogleOAuthForUser } from "../google-account-auth";
import { scopeIncludesCalendar } from "../google-oauth-scopes";
import { loadGoogleAttendeeEmailsForEvent } from "./google-calendar-attendees";
import { loadAudienceGroupEmailsForEvent } from "./expand-audience-group-members";

/** Sans ce paramètre, l’API Google ne renvoie souvent que l’organisateur (RSVP des autres invisibles). */
const GOOGLE_EVENTS_GET_OPTS = { maxAttendees: 500 } as const;

type GoogleResponseStatus = "needsAction" | "accepted" | "declined" | "tentative";

export function appRsvpToGoogle(status: AgendaRsvpStatus): GoogleResponseStatus {
  switch (status) {
    case "accepted":
      return "accepted";
    case "declined":
      return "declined";
    case "tentative":
      return "tentative";
    default:
      return "needsAction";
  }
}

export function googleRsvpToApp(status: string | null | undefined): AgendaRsvpStatus {
  switch (status) {
    case "accepted":
      return "accepted";
    case "declined":
      return "declined";
    case "tentative":
      return "tentative";
    default:
      return "pending";
  }
}

async function getOrganizerCalendarContext(eventId: string) {
  const [e] = await db.select().from(agendaEvent).where(eq(agendaEvent.id, eventId)).limit(1);
  if (!e?.googleEventId) return null;

  const authRes = await getGoogleOAuthForUser(e.createdByUserId, {
    driveRead: false,
    driveWrite: false,
    spreadsheets: false,
  });
  if (!authRes.ok || !scopeIncludesCalendar(authRes.scope)) return null;

  return {
    event: e,
    calendar: google.calendar({ version: "v3", auth: authRes.auth }),
    calendarId: e.googleCalendarId ?? "primary",
    googleEventId: e.googleEventId,
  };
}

type ApplyGoogleAttendeeOpts = {
  /** Met à jour même l’organisateur (réponse sur sa copie Calendar). */
  allowOrganizer?: boolean;
};

async function applyGoogleAttendeeToDb(
  eventId: string,
  attendee: calendar_v3.Schema$EventAttendee,
  skipEmails: Set<string>,
  opts?: ApplyGoogleAttendeeOpts,
): Promise<boolean> {
  if (!attendee.email?.includes("@")) return false;
  const email = attendee.email.trim().toLowerCase();
  if (skipEmails.has(email)) return false;
  const rsvpStatus = googleRsvpToApp(attendee.responseStatus);
  const displayName = attendee.displayName?.trim() || null;

  const [row] = await db
    .select()
    .from(agendaEventParticipant)
    .where(
      and(
        eq(agendaEventParticipant.eventId, eventId),
        sql`lower(${agendaEventParticipant.email}) = ${email}`,
      ),
    )
    .limit(1);

  if (row) {
    if (row.role === "organizer" && !opts?.allowOrganizer) return false;
    if (row.rsvpStatus === rsvpStatus && row.displayName === displayName) return false;
    await db
      .update(agendaEventParticipant)
      .set({ rsvpStatus, displayName: displayName ?? row.displayName })
      .where(eq(agendaEventParticipant.id, row.id));
    return true;
  }

  if (attendee.organizer && !opts?.allowOrganizer) return false;

  await db
    .insert(agendaEventParticipant)
    .values({
      id: crypto.randomUUID(),
      eventId,
      email,
      displayName,
      rsvpStatus,
      role: "attendee",
    })
    .onConflictDoUpdate({
      target: [agendaEventParticipant.eventId, agendaEventParticipant.email],
      set: {
        rsvpStatus,
        ...(displayName ? { displayName } : {}),
      },
    });
  return true;
}

/** Lit la réponse RSVP de l’utilisateur connecté sur sa copie Calendar (même iCalUID). */
async function pullViewerSelfRsvpFromGoogle(
  eventId: string,
  viewingUserId: string,
  viewerEmail: string,
  iCalUID: string | null | undefined,
): Promise<boolean> {
  if (!iCalUID?.trim()) return false;

  const authRes = await getGoogleOAuthForUser(viewingUserId, {
    driveRead: false,
    driveWrite: false,
    spreadsheets: false,
  });
  if (!authRes.ok || !scopeIncludesCalendar(authRes.scope)) return false;

  const calendar = google.calendar({ version: "v3", auth: authRes.auth });
  const list = await calendar.events.list({
    calendarId: "primary",
    iCalUID: iCalUID.trim(),
    maxResults: 5,
    singleEvents: true,
  });
  const item = list.data.items?.[0];
  if (!item?.id) return false;

  const full = await calendar.events.get({
    calendarId: "primary",
    eventId: item.id,
    ...GOOGLE_EVENTS_GET_OPTS,
  });
  const attendees = full.data.attendees ?? [];
  if (attendees.length === 0) return false;

  const emailLower = viewerEmail.trim().toLowerCase();
  const self =
    attendees.find((a) => a.self) ??
    attendees.find((a) => a.email?.trim().toLowerCase() === emailLower);
  if (!self) return false;

  const skipEmails = await loadAudienceGroupEmailsForEvent(eventId);
  return applyGoogleAttendeeToDb(eventId, self, skipEmails, {
    allowOrganizer: true,
  });
}

/** Liste invités Google : BDD + invités déjà sur l’événement (ex. membres d’un groupe). */
export async function buildMergedGoogleAttendees(
  eventId: string,
  calendar: calendar_v3.Calendar,
  calendarId: string,
  googleEventId: string,
): Promise<calendar_v3.Schema$EventAttendee[]> {
  const dbEmails = await loadGoogleAttendeeEmailsForEvent(eventId);
  const existing = await calendar.events.get({
    calendarId,
    eventId: googleEventId,
    ...GOOGLE_EVENTS_GET_OPTS,
  });
  const googleAttendees = existing.data.attendees ?? [];

  const emailSet = new Set(dbEmails.map((x) => x.toLowerCase()));
  for (const a of googleAttendees) {
    if (a.email && !a.organizer) emailSet.add(a.email.toLowerCase());
  }

  const googleByEmail = new Map(
    googleAttendees
      .filter((a) => a.email)
      .map((a) => [a.email!.toLowerCase(), a] as const),
  );

  return [...emailSet].map((email) => {
    const prev = googleByEmail.get(email);
    return {
      email,
      displayName: prev?.displayName ?? undefined,
      responseStatus: (prev?.responseStatus as GoogleResponseStatus | undefined) ?? "needsAction",
    };
  });
}

/** App → Google : met à jour la réponse RSVP d’un participant sur l’événement Calendar. */
export async function pushParticipantRsvpToGoogle(
  eventId: string,
  participantEmail: string,
  rsvpStatus: AgendaRsvpStatus,
): Promise<{ ok: boolean; message?: string }> {
  const ctx = await getOrganizerCalendarContext(eventId);
  if (!ctx) return { ok: false, message: "Événement Google ou OAuth indisponible." };

  const email = participantEmail.trim().toLowerCase();
  const googleStatus = appRsvpToGoogle(rsvpStatus);

  try {
    let attendees = await buildMergedGoogleAttendees(
      eventId,
      ctx.calendar,
      ctx.calendarId,
      ctx.googleEventId,
    );
    const idx = attendees.findIndex((a) => a.email?.toLowerCase() === email);
    if (idx >= 0) {
      attendees = attendees.map((a, i) =>
        i === idx ? { ...a, email, responseStatus: googleStatus } : a,
      );
    } else {
      attendees = [...attendees, { email, responseStatus: googleStatus }];
    }

    await ctx.calendar.events.patch({
      calendarId: ctx.calendarId,
      eventId: ctx.googleEventId,
      sendUpdates: "all",
      requestBody: { attendees },
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, message: `Échec envoi RSVP vers Google : ${message}` };
  }
}

/** Google → App : importe les réponses RSVP des invités Calendar en base. */
export async function pullGoogleRsvpsIntoEvent(
  eventId: string,
  viewingUserId?: string,
  viewingUserEmail?: string,
): Promise<{ ok: boolean; updated: number; message?: string }> {
  const ctx = await getOrganizerCalendarContext(eventId);
  if (!ctx) {
    return { ok: false, updated: 0, message: "Événement Google ou OAuth créateur indisponible." };
  }

  let updated = 0;

  try {
    const res = await ctx.calendar.events.get({
      calendarId: ctx.calendarId,
      eventId: ctx.googleEventId,
      ...GOOGLE_EVENTS_GET_OPTS,
    });
    const googleAttendees = res.data.attendees ?? [];
    const iCalUID = res.data.iCalUID;
    const skipEmails = await loadAudienceGroupEmailsForEvent(eventId);
    const viewerEmailLower = viewingUserEmail?.trim().toLowerCase() ?? "";

    for (const a of googleAttendees) {
      const em = a.email?.trim().toLowerCase();
      if (viewerEmailLower && em === viewerEmailLower) continue;
      if (await applyGoogleAttendeeToDb(eventId, a, skipEmails)) updated += 1;
    }

    if (viewingUserId && viewingUserEmail) {
      if (await pullViewerSelfRsvpFromGoogle(eventId, viewingUserId, viewingUserEmail, iCalUID)) {
        updated += 1;
      }
    }

    return { ok: true, updated };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[agenda-google-rsvp] pull failed:", eventId, message);
    return { ok: false, updated, message };
  }
}

/** Invités Calendar avec préservation des RSVP existants. */
export async function patchGoogleCalendarAttendeesMerged(
  eventId: string,
  sendUpdates: "all" | "none" = "all",
): Promise<{ ok: boolean; message?: string }> {
  const ctx = await getOrganizerCalendarContext(eventId);
  if (!ctx) return { ok: false, message: "Aucun événement Google lié." };

  try {
    const attendees = await buildMergedGoogleAttendees(
      eventId,
      ctx.calendar,
      ctx.calendarId,
      ctx.googleEventId,
    );
    if (attendees.length === 0) return { ok: true };

    await ctx.calendar.events.patch({
      calendarId: ctx.calendarId,
      eventId: ctx.googleEventId,
      sendUpdates,
      requestBody: { attendees },
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, message: `Échec sync invités Google : ${message}` };
  }
}
