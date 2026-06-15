import { google } from "googleapis";

import { getGoogleOAuthForUser } from "../google-account-auth";
import { scopeIncludesCalendar } from "../google-oauth-scopes";
import { dedupeAttendeeEmails } from "./google-calendar-attendees";

export type MeetEventInput = {
  title: string;
  description?: string;
  startsAt: Date;
  endsAt: Date;
  allDay: boolean;
  timezone?: string | null;
  location?: string | null;
  /** E-mails invités (groupes Google Workspace, participants). */
  attendeeEmails?: string[];
};

export type CreateMeetResult =
  | {
      ok: true;
      meetUrl: string;
      googleEventId: string;
      googleCalendarId: string;
    }
  | { ok: false; message: string; gaps?: string[] };

/** Crée un événement Calendar avec lien Google Meet (compte Google du créateur). */
export async function createGoogleMeetForEvent(
  userId: string,
  input: MeetEventInput,
): Promise<CreateMeetResult> {
  const authRes = await getGoogleOAuthForUser(userId, {
    driveRead: false,
    driveWrite: false,
    spreadsheets: false,
  });
  if (!authRes.ok) {
    return { ok: false, message: authRes.message, gaps: authRes.gaps };
  }
  if (!scopeIncludesCalendar(authRes.scope)) {
    return {
      ok: false,
      message:
        "Le compte Google n’a pas l’accès Calendar. Déconnectez-vous puis reconnectez-vous avec Google.",
      gaps: ["calendar"],
    };
  }

  const calendar = google.calendar({ version: "v3", auth: authRes.auth });
  const calendarId = "primary";
  const tz = input.timezone?.trim() || "Europe/Paris";
  const requestId = crypto.randomUUID();
  const attendeeEmails = dedupeAttendeeEmails(input.attendeeEmails ?? []);

  try {
    const res = await calendar.events.insert({
      calendarId,
      conferenceDataVersion: 1,
      sendUpdates: attendeeEmails.length > 0 ? "all" : "none",
      requestBody: {
        summary: input.title,
        description: input.description || undefined,
        location: input.location || undefined,
        start: input.allDay
          ? { date: input.startsAt.toISOString().slice(0, 10) }
          : { dateTime: input.startsAt.toISOString(), timeZone: tz },
        end: input.allDay
          ? { date: input.endsAt.toISOString().slice(0, 10) }
          : { dateTime: input.endsAt.toISOString(), timeZone: tz },
        attendees: attendeeEmails.map((email) => ({ email })),
        conferenceData: {
          createRequest: {
            requestId,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      },
    });

    const meetUrl =
      res.data.hangoutLink ??
      res.data.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri ??
      null;
    const googleEventId = res.data.id;

    if (!meetUrl || !googleEventId) {
      return {
        ok: false,
        message: "Google Calendar n’a pas renvoyé de lien Meet.",
      };
    }

    return {
      ok: true,
      meetUrl,
      googleEventId,
      googleCalendarId: calendarId,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, message: `Échec création Google Meet : ${message}` };
  }
}
