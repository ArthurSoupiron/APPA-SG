import { eq, inArray } from "drizzle-orm";

import { db } from "../../db";
import {
  agendaEventAudienceGroup,
  agendaEventParticipant,
  workspaceGroup,
} from "../../db/schema";
import { patchGoogleCalendarAttendeesMerged } from "./google-calendar-rsvp";

export function dedupeAttendeeEmails(emails: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of emails) {
    const email = raw.trim().toLowerCase();
    if (!email || !email.includes("@") || seen.has(email)) continue;
    seen.add(email);
    out.push(email);
  }
  return out;
}

export async function resolveGoogleAttendeeEmailsFromGroupIds(
  groupIds: string[],
): Promise<string[]> {
  if (groupIds.length === 0) return [];
  const rows = await db
    .select({ email: workspaceGroup.email })
    .from(workspaceGroup)
    .where(inArray(workspaceGroup.id, groupIds));
  return dedupeAttendeeEmails(rows.map((r) => r.email));
}

/** E-mails invités Calendar : groupes GW audience + participants enregistrés. */
export async function loadGoogleAttendeeEmailsForEvent(eventId: string): Promise<string[]> {
  const [groupRows, participantRows] = await Promise.all([
    db
      .select({ email: workspaceGroup.email })
      .from(agendaEventAudienceGroup)
      .innerJoin(workspaceGroup, eq(workspaceGroup.id, agendaEventAudienceGroup.workspaceGroupId))
      .where(eq(agendaEventAudienceGroup.eventId, eventId)),
    db
      .select({ email: agendaEventParticipant.email })
      .from(agendaEventParticipant)
      .where(eq(agendaEventParticipant.eventId, eventId)),
  ]);
  return dedupeAttendeeEmails([
    ...groupRows.map((r) => r.email),
    ...participantRows.map((r) => r.email),
  ]);
}

/**
 * Met à jour les invités sur l’événement Google Calendar lié (groupes + participants).
 * Préserve les réponses RSVP déjà enregistrées côté Google.
 */
export async function syncGoogleCalendarEventInvites(
  eventId: string,
): Promise<{ ok: boolean; message?: string }> {
  const emails = await loadGoogleAttendeeEmailsForEvent(eventId);
  return patchGoogleCalendarAttendeesMerged(eventId, emails.length > 0 ? "all" : "none");
}
