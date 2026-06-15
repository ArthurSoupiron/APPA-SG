import { eq } from "drizzle-orm";

import { db } from "../../db";
import {
  AGENDA_AUDIENCES,
  AGENDA_POLES,
  agendaEvent,
  agendaEventAudience,
  agendaEventAudienceGroup,
  agendaEventParticipant,
  agendaEventType,
  type AgendaAudience,
  type AgendaPole,
} from "../../db/schema";
import { validateUbacWorkspaceGroupIds } from "./workspace-groups";
import { notifyAgendaUsers } from "./agenda-notifications";
import { recordAgendaChange } from "./event-change-log";
import { syncGoogleCalendarEventInvites } from "./google-calendar-attendees";
import { pushEventToUserGoogleCalendar } from "./google-calendar-sync";
import type { AgendaAccessContext } from "./event-access";

const MAX_TITLE = 300;
const MAX_DESCRIPTION = 32_000;
const MAX_COMMENT = 16_000;

export function parsePole(raw: unknown): AgendaPole | null {
  return typeof raw === "string" && (AGENDA_POLES as readonly string[]).includes(raw)
    ? (raw as AgendaPole)
    : null;
}

export function parseAudiences(raw: unknown): AgendaAudience[] {
  if (!Array.isArray(raw)) return [];
  const out: AgendaAudience[] = [];
  for (const a of raw) {
    if (typeof a !== "string" || !(AGENDA_AUDIENCES as readonly string[]).includes(a)) continue;
    if (!out.includes(a as AgendaAudience)) out.push(a as AgendaAudience);
  }
  return out;
}

export function parseAudienceGroupIds(raw: unknown): string[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: string[] = [];
  for (const id of raw) {
    if (typeof id !== "string" || !id.trim()) return null;
    const v = id.trim();
    if (!out.includes(v)) out.push(v);
  }
  return out.length > 0 ? out : null;
}

export async function parseAndValidateAudienceGroupIds(raw: unknown): Promise<string[] | null> {
  const ids = parseAudienceGroupIds(raw);
  if (!ids) return null;
  const ok = await validateUbacWorkspaceGroupIds(ids);
  return ok ? ids : null;
}

export function parseOptionalUrl(raw: unknown): string | null {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw !== "string") return null;
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function parseIsoDate(raw: unknown): Date | null {
  if (typeof raw !== "string") return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export { MAX_TITLE, MAX_DESCRIPTION, MAX_COMMENT };

export async function replaceEventAudiences(eventId: string, audiences: AgendaAudience[]) {
  await db.delete(agendaEventAudience).where(eq(agendaEventAudience.eventId, eventId));
  if (audiences.length === 0) return;
  await db.insert(agendaEventAudience).values(
    audiences.map((audience) => ({ eventId, audience })),
  );
}

export async function replaceEventAudienceGroups(eventId: string, groupIds: string[]) {
  await db.delete(agendaEventAudienceGroup).where(eq(agendaEventAudienceGroup.eventId, eventId));
  if (groupIds.length === 0) return;
  await db.insert(agendaEventAudienceGroup).values(
    groupIds.map((workspaceGroupId) => ({ eventId, workspaceGroupId })),
  );
}

export async function upsertParticipants(
  eventId: string,
  participants: {
    email: string;
    displayName?: string;
    userId?: string;
    role?: "organizer" | "attendee";
  }[],
) {
  for (const p of participants) {
    const email = p.email.trim().toLowerCase();
    if (!email) continue;
    await db
      .insert(agendaEventParticipant)
      .values({
        id: crypto.randomUUID(),
        eventId,
        email,
        displayName: p.displayName?.trim() || null,
        userId: p.userId ?? null,
        role: (p.role === "organizer" ? "organizer" : "attendee") as "organizer" | "attendee",
      })
      .onConflictDoUpdate({
        target: [agendaEventParticipant.eventId, agendaEventParticipant.email],
        set: {
          displayName: p.displayName?.trim() || null,
          userId: p.userId ?? null,
        },
      });
  }
}

export async function afterEventMutation(
  eventId: string,
  actorUserId: string,
  action: string,
  notifyUserIds: string[],
  email?: { subject: string; bodyText: string },
) {
  await recordAgendaChange(eventId, actorUserId, action);
  if (notifyUserIds.length > 0) {
    await notifyAgendaUsers(notifyUserIds, eventId, action, { eventId }, email);
  }
  void pushEventToUserGoogleCalendar(actorUserId, eventId);
  void syncGoogleCalendarEventInvites(eventId).then((res) => {
    if (!res.ok && res.message) {
      console.warn("[agenda-google-invites]", eventId, res.message);
    }
  });
}

export async function validateEventTypeForPole(typeId: string, pole: AgendaPole) {
  const [row] = await db
    .select()
    .from(agendaEventType)
    .where(eq(agendaEventType.id, typeId))
    .limit(1);
  if (!row || !row.isActive || row.pole !== pole) return null;
  return row;
}

export function collectManageNotifyIds(access: AgendaAccessContext, pole: AgendaPole): string[] {
  return access.managedPoles.has(pole) ? [] : [];
}
