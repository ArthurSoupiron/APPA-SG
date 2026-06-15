import { and, desc, eq, gte, ilike, isNull, lte, or } from "drizzle-orm";
import type { Context, Hono as HonoType } from "hono";
import { Hono } from "hono";

import { db } from "../../db";
import {
  agendaEvent,
  agendaEventComment,
  agendaEventNotification,
  agendaEventParticipant,
} from "../../db/schema";
import type { AgendaPole } from "../../db/schema/agenda/poles";
import { agendaPoleDeletePermission } from "../../lib/agenda/agenda-permissions";
import {
  buildAgendaAccessContext,
  canDeleteEvent,
  canEditEvent,
  canReadAgenda,
  canWritePole,
} from "../../lib/agenda/event-access";
import { exportAgendaEventsToSheet } from "../../lib/agenda/agenda-sheet-export";
import { deleteGoogleCalendarEvent } from "../../lib/agenda/google-calendar-sync";
import { syncExpandedAudienceParticipants } from "../../lib/agenda/expand-audience-group-members";
import { resolveGoogleAttendeeEmailsFromGroupIds } from "../../lib/agenda/google-calendar-attendees";
import {
  pullGoogleRsvpsIntoEvent,
  pushParticipantRsvpToGoogle,
} from "../../lib/agenda/google-calendar-rsvp";
import { createGoogleMeetForEvent } from "../../lib/agenda/google-meet";
import {
  afterEventMutation,
  MAX_COMMENT,
  MAX_DESCRIPTION,
  MAX_TITLE,
  parseAndValidateAudienceGroupIds,
  parseAudiences,
  parseIsoDate,
  parseOptionalUrl,
  parsePole,
  replaceEventAudienceGroups,
  replaceEventAudiences,
  upsertParticipants,
  validateEventTypeForPole,
} from "../../lib/agenda/event-mutations";
import { allocateAgendaEventReference } from "../../lib/agenda/event-reference";
import { serializeEventDetail, serializeEventListItems } from "../../lib/agenda/event-serialize";
import {
  setUserCalendarSyncEnabled,
  syncPublishedMandatEventsForUser,
} from "../../lib/agenda/google-calendar-sync";
import { notifyAgendaUsers } from "../../lib/agenda/agenda-notifications";
import { recordAgendaChange } from "../../lib/agenda/event-change-log";
import type { AppVariables } from "../../types/app";

type Ctx = Context<{ Variables: AppVariables }>;

function denyUnlessAuth(c: Ctx): Response | null {
  if (!c.get("user")) return c.json({ error: "unauthorized" }, 401);
  return null;
}

function eventIdParam(c: Ctx): string | Response {
  const id = c.req.param("id");
  if (!id) return c.json({ error: "bad_request" }, 400);
  return id;
}

export function registerAgendaEventRoutes(app: HonoType<{ Variables: AppVariables }>) {
  const router = new Hono<{ Variables: AppVariables }>();

  router.get("/notifications", async (c) => listNotifications(c));
  router.post("/notifications/read", async (c) => markNotificationsRead(c));

  router.get("/", async (c) => listEvents(c));
  router.post("/", async (c) => createEvent(c));
  router.post("/export/sheet", async (c) => exportSheet(c));
  router.post("/sync/google", async (c) => configureGoogleSync(c));

  router.get("/:id", async (c) => getEvent(c));
  router.patch("/:id", async (c) => patchEvent(c));
  router.post("/:id/sync/google-rsvp", async (c) => syncGoogleRsvp(c));
  router.delete("/:id", async (c) => deleteEvent(c));
  router.post("/:id/comments", async (c) => addComment(c));
  router.post("/:id/participants", async (c) => addParticipants(c));
  router.patch("/:id/participants/:participantId", async (c) => patchParticipantRsvp(c));

  app.route("/api/app/agenda/events", router);
}

async function listNotifications(c: Ctx) {
  const denied = denyUnlessAuth(c);
  if (denied) return denied;
  if (!canReadAgenda(c)) return c.json({ error: "forbidden", need: "agenda.read" }, 403);
  const user = c.get("user")!;
  const rows = await db
    .select()
    .from(agendaEventNotification)
    .where(eq(agendaEventNotification.userId, user.id))
    .orderBy(desc(agendaEventNotification.createdAt))
    .limit(50);
  return c.json({
    notifications: rows.map((n) => ({
      id: n.id,
      eventId: n.eventId,
      kind: n.kind,
      payload: n.payload,
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    })),
  });
}

async function markNotificationsRead(c: Ctx) {
  const denied = denyUnlessAuth(c);
  if (denied) return denied;
  const user = c.get("user")!;
  const body = (await c.req.json().catch(() => null)) as { ids?: string[] } | null;
  const ids = Array.isArray(body?.ids) ? body.ids.filter((x) => typeof x === "string") : [];
  if (ids.length > 0) {
    const { markAgendaNotificationsRead } = await import("../../lib/agenda/agenda-notifications");
    await markAgendaNotificationsRead(user.id, ids);
  }
  return c.json({ ok: true });
}

async function listEvents(c: Ctx) {
  const denied = denyUnlessAuth(c);
  if (denied) return denied;
  if (!canReadAgenda(c)) return c.json({ error: "forbidden", need: "agenda.read" }, 403);
  const access = await buildAgendaAccessContext(c);
  if (!access) return c.json({ error: "unauthorized" }, 401);

  const from = parseIsoDate(c.req.query("from") ?? "");
  const to = parseIsoDate(c.req.query("to") ?? "");
  const q = c.req.query("q")?.trim();
  const pole = parsePole(c.req.query("pole") ?? "");
  const status = c.req.query("status")?.trim();

  const conditions = [isNull(agendaEvent.deletedAt)];
  if (from) conditions.push(gte(agendaEvent.startsAt, from));
  if (to) conditions.push(lte(agendaEvent.endsAt, to));
  if (pole) conditions.push(eq(agendaEvent.pole, pole));
  if (status === "draft" || status === "published" || status === "cancelled") {
    conditions.push(eq(agendaEvent.status, status));
  }
  if (q) {
    conditions.push(or(ilike(agendaEvent.title, `%${q}%`), ilike(agendaEvent.reference, `%${q}%`))!);
  }

  const ordered = await db
    .select()
    .from(agendaEvent)
    .where(and(...conditions))
    .orderBy(agendaEvent.startsAt);

  const events = await serializeEventListItems(ordered, access);
  return c.json({ events });
}

async function getEvent(c: Ctx) {
  const denied = denyUnlessAuth(c);
  if (denied) return denied;
  if (!canReadAgenda(c)) return c.json({ error: "forbidden", need: "agenda.read" }, 403);
  const access = await buildAgendaAccessContext(c);
  if (!access) return c.json({ error: "unauthorized" }, 401);

  const idOr = eventIdParam(c);
  if (idOr instanceof Response) return idOr;
  const id = idOr;
  const [row] = await db.select().from(agendaEvent).where(eq(agendaEvent.id, id)).limit(1);
  if (!row) return c.json({ error: "not_found" }, 404);

  if (row.googleEventId) {
    const user = c.get("user")!;
    await pullGoogleRsvpsIntoEvent(id, user.id, user.email ?? access.email);
  }

  const detail = await serializeEventDetail(row, access);
  if (!detail) return c.json({ error: "forbidden" }, 403);
  return c.json(detail);
}

async function createEvent(c: Ctx) {
  const denied = denyUnlessAuth(c);
  if (denied) return denied;
  const access = await buildAgendaAccessContext(c);
  if (!access) return c.json({ error: "unauthorized" }, 401);

  const body = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
  const pole = parsePole(body?.pole);
  if (!pole || !canWritePole(access, pole)) {
    return c.json({ error: "forbidden" }, 403);
  }

  const typeId = typeof body?.typeId === "string" ? body.typeId : "";
  const typeRow = await validateEventTypeForPole(typeId, pole);
  if (!typeRow) return c.json({ error: "invalid_type" }, 400);

  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (!title || title.length > MAX_TITLE) return c.json({ error: "bad_request" }, 400);

  const description =
    typeof body?.description === "string" ? body.description.slice(0, MAX_DESCRIPTION) : "";
  const startsAt = parseIsoDate(body?.startsAt);
  const endsAt = parseIsoDate(body?.endsAt);
  if (!startsAt || !endsAt || endsAt < startsAt) return c.json({ error: "bad_request" }, 400);

  const audiences = parseAudiences(body?.audiences);
  const audienceGroupIds = await parseAndValidateAudienceGroupIds(body?.audienceGroupIds);
  if (!audienceGroupIds) {
    return c.json(
      { error: "bad_request", message: "Sélectionnez au moins un groupe Google Workspace (UBAC)." },
      400,
    );
  }

  const status =
    body?.status === "published" || body?.status === "draft" ? body.status : "draft";
  const createGoogleMeet = body?.createGoogleMeet === true;
  const allDay = body?.allDay === true;
  const timezone = typeof body?.timezone === "string" ? body.timezone : null;
  const location = typeof body?.location === "string" ? body.location.trim() || null : null;

  const now = new Date();
  const id = crypto.randomUUID();
  const reference = await allocateAgendaEventReference(now);
  const user = c.get("user")!;

  let meetUrl: string | null = parseOptionalUrl(body?.meetUrl);
  let googleEventId: string | null = null;
  let googleCalendarId: string | null = null;

  const inviteEmailsFromGroups = await resolveGoogleAttendeeEmailsFromGroupIds(audienceGroupIds);

  if (createGoogleMeet) {
    const meetRes = await createGoogleMeetForEvent(user.id, {
      title,
      description,
      startsAt,
      endsAt,
      allDay,
      timezone,
      location,
      attendeeEmails: inviteEmailsFromGroups,
    });
    if (!meetRes.ok) {
      return c.json({ error: "google_meet_failed", message: meetRes.message, gaps: meetRes.gaps }, 502);
    }
    meetUrl = meetRes.meetUrl;
    googleEventId = meetRes.googleEventId;
    googleCalendarId = meetRes.googleCalendarId;
  }

  await db.insert(agendaEvent).values({
    id,
    reference,
    pole,
    typeId,
    title,
    description,
    status,
    startsAt,
    endsAt,
    allDay,
    timezone,
    location,
    meetUrl,
    driveUrl: parseOptionalUrl(body?.driveUrl),
    recurrenceRule: typeof body?.recurrenceRule === "string" ? body.recurrenceRule.trim() || null : null,
    googleEventId,
    googleCalendarId,
    syncStatus: googleEventId ? "synced" : null,
    lastSyncedAt: googleEventId ? new Date() : null,
    createdByUserId: user.id,
    updatedByUserId: user.id,
  });

  await replaceEventAudiences(id, audiences);
  await replaceEventAudienceGroups(id, audienceGroupIds);
  await syncExpandedAudienceParticipants(id);

  await upsertParticipants(id, [
    {
      email: user.email ?? `${user.id}@local`,
      displayName: user.name ?? undefined,
      userId: user.id,
      role: "organizer",
    },
  ]);

  const participants = Array.isArray(body?.participants) ? body.participants : [];
  if (participants.length > 0) {
    const parsed = participants
      .filter((p): p is Record<string, unknown> => typeof p === "object" && p !== null)
      .map((p) => ({
        email: typeof p.email === "string" ? p.email : "",
        displayName: typeof p.displayName === "string" ? p.displayName : undefined,
        userId: typeof p.userId === "string" ? p.userId : undefined,
      }))
      .filter((p) => p.email);
    await upsertParticipants(id, parsed);
  }

  await afterEventMutation(id, user.id, "created", [], {
    subject: `Nouvel événement : ${title}`,
    bodyText: `${reference} — ${title}`,
  });

  const [row] = await db.select().from(agendaEvent).where(eq(agendaEvent.id, id)).limit(1);
  const detail = row ? await serializeEventDetail(row, access) : null;
  return c.json(detail, 201);
}

async function patchEvent(c: Ctx) {
  const denied = denyUnlessAuth(c);
  if (denied) return denied;
  const access = await buildAgendaAccessContext(c);
  if (!access) return c.json({ error: "unauthorized" }, 401);

  const idOr = eventIdParam(c);
  if (idOr instanceof Response) return idOr;
  const id = idOr;
  const [existing] = await db.select().from(agendaEvent).where(eq(agendaEvent.id, id)).limit(1);
  if (!existing || existing.deletedAt) return c.json({ error: "not_found" }, 404);
  if (!canEditEvent(access, existing)) return c.json({ error: "forbidden" }, 403);

  const body = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
  const user = c.get("user")!;
  const patch: Partial<typeof agendaEvent.$inferInsert> = {
    updatedByUserId: user.id,
  };

  if (typeof body?.title === "string") patch.title = body.title.trim().slice(0, MAX_TITLE);
  if (typeof body?.description === "string") patch.description = body.description.slice(0, MAX_DESCRIPTION);
  if (body?.startsAt) {
    const d = parseIsoDate(body.startsAt);
    if (d) patch.startsAt = d;
  }
  if (body?.endsAt) {
    const d = parseIsoDate(body.endsAt);
    if (d) patch.endsAt = d;
  }
  if (typeof body?.allDay === "boolean") patch.allDay = body.allDay;
  if (body?.status === "draft" || body?.status === "published" || body?.status === "cancelled") {
    patch.status = body.status;
  }
  if (body?.meetUrl !== undefined) patch.meetUrl = parseOptionalUrl(body.meetUrl);
  if (body?.driveUrl !== undefined) patch.driveUrl = parseOptionalUrl(body.driveUrl);
  if (typeof body?.location === "string") patch.location = body.location.trim() || null;
  if (typeof body?.recurrenceRule === "string") {
    patch.recurrenceRule = body.recurrenceRule.trim() || null;
  }

  await db.update(agendaEvent).set(patch).where(eq(agendaEvent.id, id));

  const audiences = body?.audiences !== undefined ? parseAudiences(body.audiences) : undefined;
  if (audiences !== undefined) await replaceEventAudiences(id, audiences);

  if (body?.audienceGroupIds !== undefined) {
    const groupIds = await parseAndValidateAudienceGroupIds(body.audienceGroupIds);
    if (!groupIds) {
      return c.json({ error: "bad_request", message: "Groupes audience invalides." }, 400);
    }
    await replaceEventAudienceGroups(id, groupIds);
    await syncExpandedAudienceParticipants(id);
  }

  const participantIds = await db
    .select({ userId: agendaEventParticipant.userId })
    .from(agendaEventParticipant)
    .where(eq(agendaEventParticipant.eventId, id));

  const notifyIds = participantIds.map((p) => p.userId).filter(Boolean) as string[];

  await afterEventMutation(id, user.id, "updated", notifyIds, {
    subject: `Événement mis à jour : ${patch.title ?? existing.title}`,
    bodyText: existing.reference,
  });

  const [row] = await db.select().from(agendaEvent).where(eq(agendaEvent.id, id)).limit(1);
  const detail = row ? await serializeEventDetail(row, access) : null;
  return c.json(detail);
}

async function syncGoogleRsvp(c: Ctx) {
  const denied = denyUnlessAuth(c);
  if (denied) return denied;
  if (!canReadAgenda(c)) return c.json({ error: "forbidden", need: "agenda.read" }, 403);
  const access = await buildAgendaAccessContext(c);
  if (!access) return c.json({ error: "unauthorized" }, 401);

  const idOr = eventIdParam(c);
  if (idOr instanceof Response) return idOr;
  const id = idOr;
  const [row] = await db.select().from(agendaEvent).where(eq(agendaEvent.id, id)).limit(1);
  if (!row) return c.json({ error: "not_found" }, 404);

  const user = c.get("user")!;
  const pull = row.googleEventId
    ? await pullGoogleRsvpsIntoEvent(id, user.id, user.email ?? access.email)
    : { ok: false, updated: 0, message: "Aucun lien Google Calendar." };

  const detail = await serializeEventDetail(row, access);
  if (!detail) return c.json({ error: "forbidden" }, 403);
  return c.json({ ...detail, googleRsvpPull: pull });
}

async function deleteEvent(c: Ctx) {
  const denied = denyUnlessAuth(c);
  if (denied) return denied;
  const access = await buildAgendaAccessContext(c);
  if (!access) return c.json({ error: "unauthorized" }, 401);
  const user = c.get("user")!;

  const idOr = eventIdParam(c);
  if (idOr instanceof Response) return idOr;
  const id = idOr;

  const [existing] = await db.select().from(agendaEvent).where(eq(agendaEvent.id, id)).limit(1);
  if (!existing || existing.deletedAt) return c.json({ error: "not_found" }, 404);
  if (!canDeleteEvent(access, existing)) {
    return c.json(
      { error: "forbidden", need: agendaPoleDeletePermission(existing.pole as AgendaPole) },
      403,
    );
  }

  const googleDelete = await deleteGoogleCalendarEvent({
    googleEventId: existing.googleEventId,
    googleCalendarId: existing.googleCalendarId,
    createdByUserId: existing.createdByUserId,
  });
  if (!googleDelete.ok) {
    console.warn("[agenda-google-delete]", id, googleDelete.message);
  }

  await db
    .update(agendaEvent)
    .set({
      deletedAt: new Date(),
      updatedByUserId: user.id,
      googleEventId: null,
      googleCalendarId: null,
      syncStatus: googleDelete.ok ? null : "error",
    })
    .where(eq(agendaEvent.id, id));
  await recordAgendaChange(id, user.id, "deleted", {
    googleCalendarRemoved: googleDelete.ok,
    googleError: googleDelete.ok ? undefined : googleDelete.message,
  });
  return c.json({ ok: true, googleCalendarRemoved: googleDelete.ok });
}

async function addComment(c: Ctx) {
  const denied = denyUnlessAuth(c);
  if (denied) return denied;
  const access = await buildAgendaAccessContext(c);
  if (!access) return c.json({ error: "unauthorized" }, 401);

  const idOr = eventIdParam(c);
  if (idOr instanceof Response) return idOr;
  const id = idOr;
  const [existing] = await db.select().from(agendaEvent).where(eq(agendaEvent.id, id)).limit(1);
  if (!existing) return c.json({ error: "not_found" }, 404);

  const detail = await serializeEventDetail(existing, access);
  if (!detail) return c.json({ error: "forbidden" }, 403);

  const body = (await c.req.json().catch(() => null)) as { body?: string } | null;
  const text = typeof body?.body === "string" ? body.body.trim() : "";
  if (!text || text.length > MAX_COMMENT) return c.json({ error: "bad_request" }, 400);

  const user = c.get("user")!;
  await db.insert(agendaEventComment).values({
    id: crypto.randomUUID(),
    eventId: id,
    userId: user.id,
    body: text,
  });

  await recordAgendaChange(id, user.id, "comment_added", { preview: text.slice(0, 200) });

  const [row] = await db.select().from(agendaEvent).where(eq(agendaEvent.id, id)).limit(1);
  return c.json(row ? await serializeEventDetail(row, access) : null);
}

async function addParticipants(c: Ctx) {
  const denied = denyUnlessAuth(c);
  if (denied) return denied;
  const access = await buildAgendaAccessContext(c);
  if (!access) return c.json({ error: "unauthorized" }, 401);

  const idOr = eventIdParam(c);
  if (idOr instanceof Response) return idOr;
  const id = idOr;
  const [existing] = await db.select().from(agendaEvent).where(eq(agendaEvent.id, id)).limit(1);
  if (!existing || !canEditEvent(access, existing)) return c.json({ error: "forbidden" }, 403);

  const body = (await c.req.json().catch(() => null)) as { participants?: unknown } | null;
  const list = Array.isArray(body?.participants) ? body.participants : [];
  const parsed = list
    .filter((p): p is Record<string, unknown> => typeof p === "object" && p !== null)
    .map((p) => ({
      email: typeof p.email === "string" ? p.email : "",
      displayName: typeof p.displayName === "string" ? p.displayName : undefined,
      userId: typeof p.userId === "string" ? p.userId : undefined,
    }))
    .filter((p) => p.email);

  await upsertParticipants(id, parsed);

  const user = c.get("user")!;
  const notifyIds = parsed.map((p) => p.userId).filter(Boolean) as string[];
  await notifyAgendaUsers(notifyIds, id, "invited", { eventId: id }, {
    subject: `Invitation : ${existing.title}`,
    bodyText: existing.reference,
  });

  const [row] = await db.select().from(agendaEvent).where(eq(agendaEvent.id, id)).limit(1);
  return c.json(row ? await serializeEventDetail(row, access) : null);
}

async function patchParticipantRsvp(c: Ctx) {
  const denied = denyUnlessAuth(c);
  if (denied) return denied;
  const access = await buildAgendaAccessContext(c);
  if (!access) return c.json({ error: "unauthorized" }, 401);

  const eventIdOr = eventIdParam(c);
  if (eventIdOr instanceof Response) return eventIdOr;
  const eventId = eventIdOr;
  const participantId = c.req.param("participantId");
  if (!participantId) return c.json({ error: "bad_request" }, 400);
  const body = (await c.req.json().catch(() => null)) as { rsvpStatus?: string } | null;
  const status = body?.rsvpStatus;
  if (!["pending", "accepted", "declined", "tentative"].includes(status ?? "")) {
    return c.json({ error: "bad_request" }, 400);
  }

  const [participant] = await db
    .select()
    .from(agendaEventParticipant)
    .where(eq(agendaEventParticipant.id, participantId))
    .limit(1);
  if (!participant || participant.eventId !== eventId) return c.json({ error: "not_found" }, 404);

  const user = c.get("user")!;
  const isSelf =
    participant.userId === user.id || participant.email.toLowerCase() === access.email;
  const [event] = await db.select().from(agendaEvent).where(eq(agendaEvent.id, eventId)).limit(1);
  if (!event) return c.json({ error: "not_found" }, 404);
  if (!isSelf && !canEditEvent(access, event)) return c.json({ error: "forbidden" }, 403);

  await db
    .update(agendaEventParticipant)
    .set({ rsvpStatus: status as "pending" | "accepted" | "declined" | "tentative" })
    .where(eq(agendaEventParticipant.id, participantId));

  if (event.googleEventId) {
    const pushRes = await pushParticipantRsvpToGoogle(
      eventId,
      participant.email,
      status as "pending" | "accepted" | "declined" | "tentative",
    );
    if (!pushRes.ok) {
      console.warn("[agenda-google-rsvp] push:", eventId, pushRes.message);
    }
  }

  await recordAgendaChange(eventId, user.id, "rsvp_changed", { participantId, status });
  if (event.createdByUserId !== user.id) {
    await notifyAgendaUsers([event.createdByUserId], eventId, "rsvp_changed", { status });
  }

  const [row] = await db.select().from(agendaEvent).where(eq(agendaEvent.id, eventId)).limit(1);
  const detail = row ? await serializeEventDetail(row, access) : null;
  return c.json(detail);
}

async function exportSheet(c: Ctx) {
  const denied = denyUnlessAuth(c);
  if (denied) return denied;
  if (!canReadAgenda(c)) return c.json({ error: "forbidden" }, 403);
  const user = c.get("user")!;
  const result = await exportAgendaEventsToSheet(user.id);
  if (!result.ok) return c.json({ error: "export_failed", message: result.message }, 502);
  return c.json({ ok: true });
}

async function configureGoogleSync(c: Ctx) {
  const denied = denyUnlessAuth(c);
  if (denied) return denied;
  if (!canReadAgenda(c)) return c.json({ error: "forbidden" }, 403);
  const user = c.get("user")!;
  const body = (await c.req.json().catch(() => null)) as {
    enabled?: boolean;
    googleCalendarId?: string;
  } | null;
  const enabled = body?.enabled === true;
  await setUserCalendarSyncEnabled(user.id, enabled, body?.googleCalendarId);
  if (enabled) {
    await syncPublishedMandatEventsForUser(user.id);
  }
  return c.json({ ok: true, enabled });
}
