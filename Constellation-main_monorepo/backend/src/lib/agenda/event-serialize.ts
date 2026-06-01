import { and, asc, eq, inArray } from "drizzle-orm";

import { db } from "../../db";
import {
  agendaEvent,
  agendaEventAudience,
  agendaEventAudienceGroup,
  agendaEventComment,
  agendaEventParticipant,
  agendaEventType,
  user,
  workspaceGroup,
} from "../../db/schema";
import type { AgendaAudience, AgendaRsvpStatus } from "../../db/schema/agenda/poles";
import type { AgendaAccessContext } from "./event-access";
import { canDeleteEvent, canManagePole, canViewEvent, canWritePole } from "./event-access";
import {
  expandAudienceGroupMembers,
  syncExpandedAudienceParticipants,
} from "./expand-audience-group-members";
import { upsertParticipants } from "./event-mutations";
import { buildParticipantViews } from "./participant-display";

type UserRow = { id: string; name: string | null; email: string | null };

export type AudienceGroupSummary = {
  id: string;
  email: string;
  name: string | null;
};

function slimUser(row: UserRow | undefined) {
  if (!row) return null;
  return { id: row.id, name: row.name, email: row.email };
}

export async function loadEventAudiencesMap(eventIds: string[]) {
  if (eventIds.length === 0) return new Map<string, AgendaAudience[]>();
  const rows = await db
    .select()
    .from(agendaEventAudience)
    .where(inArray(agendaEventAudience.eventId, eventIds));
  const map = new Map<string, AgendaAudience[]>();
  for (const r of rows) {
    const list = map.get(r.eventId) ?? [];
    list.push(r.audience as AgendaAudience);
    map.set(r.eventId, list);
  }
  return map;
}

export async function loadEventAudienceGroupsMap(eventIds: string[]) {
  if (eventIds.length === 0) return new Map<string, AudienceGroupSummary[]>();
  const rows = await db
    .select({
      eventId: agendaEventAudienceGroup.eventId,
      id: workspaceGroup.id,
      email: workspaceGroup.email,
      name: workspaceGroup.name,
    })
    .from(agendaEventAudienceGroup)
    .innerJoin(workspaceGroup, eq(workspaceGroup.id, agendaEventAudienceGroup.workspaceGroupId))
    .where(inArray(agendaEventAudienceGroup.eventId, eventIds));

  const map = new Map<string, AudienceGroupSummary[]>();
  for (const r of rows) {
    const list = map.get(r.eventId) ?? [];
    list.push({ id: r.id, email: r.email, name: r.name });
    map.set(r.eventId, list);
  }
  return map;
}

export async function loadParticipantFlags(access: AgendaAccessContext, eventIds: string[]) {
  if (eventIds.length === 0) return new Map<string, boolean>();
  const rows = await db
    .select({
      eventId: agendaEventParticipant.eventId,
      userId: agendaEventParticipant.userId,
      email: agendaEventParticipant.email,
    })
    .from(agendaEventParticipant)
    .where(inArray(agendaEventParticipant.eventId, eventIds));

  const map = new Map<string, boolean>();
  for (const id of eventIds) map.set(id, false);
  for (const r of rows) {
    if (r.userId === access.userId || r.email.toLowerCase() === access.email) {
      map.set(r.eventId, true);
    }
  }
  return map;
}

function serializeEventBase(
  e: typeof agendaEvent.$inferSelect,
  type: typeof agendaEventType.$inferSelect | undefined,
  audiences: AgendaAudience[],
  audienceGroups: AudienceGroupSummary[],
) {
  return {
    id: e.id,
    reference: e.reference,
    pole: e.pole,
    typeId: e.typeId,
    typeLabel: type?.label ?? "",
    typeColor: type?.color ?? null,
    title: e.title,
    description: e.description,
    status: e.status,
    startsAt: e.startsAt.toISOString(),
    endsAt: e.endsAt.toISOString(),
    allDay: e.allDay,
    timezone: e.timezone,
    location: e.location,
    meetUrl: e.meetUrl,
    driveUrl: e.driveUrl,
    recurrenceRule: e.recurrenceRule,
    recurrenceParentId: e.recurrenceParentId,
    audiences,
    audienceGroups,
    source: e.source,
    createdByUserId: e.createdByUserId,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
    deletedAt: e.deletedAt?.toISOString() ?? null,
  };
}

export async function serializeEventListItems(
  events: (typeof agendaEvent.$inferSelect)[],
  access: AgendaAccessContext,
) {
  const ids = events.map((e) => e.id);
  const [audienceMap, audienceGroupMap, participantMap, types] = await Promise.all([
    loadEventAudiencesMap(ids),
    loadEventAudienceGroupsMap(ids),
    loadParticipantFlags(access, ids),
    db.select().from(agendaEventType).where(
      inArray(
        agendaEventType.id,
        [...new Set(events.map((e) => e.typeId))],
      ),
    ),
  ]);
  const typeById = new Map(types.map((t) => [t.id, t]));

  return events
    .filter((e) => {
      const audiences = audienceMap.get(e.id) ?? [];
      const audienceGroupIds = (audienceGroupMap.get(e.id) ?? []).map((g) => g.id);
      return canViewEvent(access, e, audiences, audienceGroupIds, {
        isParticipant: participantMap.get(e.id) ?? false,
      });
    })
    .map((e) =>
      serializeEventBase(
        e,
        typeById.get(e.typeId),
        audienceMap.get(e.id) ?? [],
        audienceGroupMap.get(e.id) ?? [],
      ),
    );
}

export async function serializeEventDetail(
  e: typeof agendaEvent.$inferSelect,
  access: AgendaAccessContext,
) {
  const [audienceRows, audienceGroupRows, participants, comments, typeRow, creator, updater] =
    await Promise.all([
      db.select().from(agendaEventAudience).where(eq(agendaEventAudience.eventId, e.id)),
      db
        .select({
          id: workspaceGroup.id,
          email: workspaceGroup.email,
          name: workspaceGroup.name,
        })
        .from(agendaEventAudienceGroup)
        .innerJoin(
          workspaceGroup,
          eq(workspaceGroup.id, agendaEventAudienceGroup.workspaceGroupId),
        )
        .where(eq(agendaEventAudienceGroup.eventId, e.id)),
      db
        .select()
        .from(agendaEventParticipant)
        .where(eq(agendaEventParticipant.eventId, e.id))
        .orderBy(asc(agendaEventParticipant.createdAt)),
      db
        .select()
        .from(agendaEventComment)
        .where(eq(agendaEventComment.eventId, e.id))
        .orderBy(asc(agendaEventComment.createdAt)),
      db.select().from(agendaEventType).where(eq(agendaEventType.id, e.typeId)).limit(1),
      db
        .select({ id: user.id, name: user.name, email: user.email })
        .from(user)
        .where(eq(user.id, e.createdByUserId))
        .limit(1),
      e.updatedByUserId
        ? db
            .select({ id: user.id, name: user.name, email: user.email })
            .from(user)
            .where(eq(user.id, e.updatedByUserId))
            .limit(1)
        : Promise.resolve([]),
    ]);

  const audiences = audienceRows.map((a) => a.audience as AgendaAudience);
  const audienceGroups = audienceGroupRows.map((g) => ({
    id: g.id,
    email: g.email,
    name: g.name,
  }));
  const audienceGroupIds = audienceGroups.map((g) => g.id);
  const isParticipant = participants.some(
    (p) => p.userId === access.userId || p.email.toLowerCase() === access.email,
  );
  if (!canViewEvent(access, e, audiences, audienceGroupIds, { isParticipant })) {
    return null;
  }

  const commentUserIds = [
    ...new Set(comments.map((c) => c.userId).filter(Boolean) as string[]),
  ];
  const commentUsers =
    commentUserIds.length > 0
      ? await db
          .select({ id: user.id, name: user.name, email: user.email })
          .from(user)
          .where(inArray(user.id, commentUserIds))
      : [];
  const commentUserById = new Map(commentUsers.map((u) => [u.id, u]));

  await syncExpandedAudienceParticipants(e.id);
  const expandedMembers = await expandAudienceGroupMembers(audienceGroupIds);

  const freshParticipants = await db
    .select()
    .from(agendaEventParticipant)
    .where(eq(agendaEventParticipant.eventId, e.id))
    .orderBy(asc(agendaEventParticipant.createdAt));

  const participantViews = buildParticipantViews(
    freshParticipants.map((p) => ({
      id: p.id,
      userId: p.userId,
      email: p.email,
      displayName: p.displayName,
      rsvpStatus: p.rsvpStatus as AgendaRsvpStatus,
      role: p.role,
    })),
    audienceGroups,
    expandedMembers,
  );

  let myParticipant: { id: string; rsvpStatus: AgendaRsvpStatus } | null = null;
  const meView = participantViews.find(
    (p) => p.userId === access.userId || p.email === access.email,
  );
  if (meView) {
    if (meView.id.startsWith("audience:")) {
      await upsertParticipants(e.id, [
        { email: access.email, userId: access.userId, role: "attendee" },
      ]);
      const [dbMe] = await db
        .select({
          id: agendaEventParticipant.id,
          rsvpStatus: agendaEventParticipant.rsvpStatus,
        })
        .from(agendaEventParticipant)
        .where(
          and(
            eq(agendaEventParticipant.eventId, e.id),
            eq(agendaEventParticipant.email, access.email),
          ),
        )
        .limit(1);
      if (dbMe) myParticipant = { id: dbMe.id, rsvpStatus: dbMe.rsvpStatus };
    } else {
      myParticipant = { id: meView.id, rsvpStatus: meView.rsvpStatus };
    }
  }

  return {
    ...serializeEventBase(e, typeRow[0], audiences, audienceGroups),
    createdBy: slimUser(creator[0]),
    updatedBy: slimUser(updater[0]),
    participants: participantViews.map((p) => ({
      id: p.id,
      userId: p.userId,
      email: p.email,
      displayName: p.displayName,
      rsvpStatus: p.rsvpStatus,
      role: p.role,
      fromAudienceGroup: p.fromAudienceGroup,
      sourceGroupName: p.sourceGroupName,
    })),
    comments: comments.map((c) => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt.toISOString(),
      user: slimUser(c.userId ? commentUserById.get(c.userId) : undefined),
    })),
    myParticipant,
    canEdit:
      access.isSuperAdmin ||
      canManagePole(access, e.pole) ||
      (e.createdByUserId === access.userId && canWritePole(access, e.pole)),
    canDelete: canDeleteEvent(access, e),
  };
}
