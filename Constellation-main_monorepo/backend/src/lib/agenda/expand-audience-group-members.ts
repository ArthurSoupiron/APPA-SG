import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "../../db";
import {
  agendaEventAudienceGroup,
  agendaEventParticipant,
  workspaceGroup,
  workspaceGroupMember,
} from "../../db/schema";

export type ExpandedAudienceMember = {
  email: string;
  displayName: string | null;
  userId: string | null;
  sourceGroupId: string;
  sourceGroupEmail: string;
  sourceGroupName: string | null;
};

async function collectUsersForGroup(
  groupId: string,
  meta: { email: string; name: string | null },
  visited: Set<string>,
  out: ExpandedAudienceMember[],
) {
  if (visited.has(groupId)) return;
  visited.add(groupId);

  const edges = await db
    .select()
    .from(workspaceGroupMember)
    .where(eq(workspaceGroupMember.containerGroupId, groupId));

  for (const edge of edges) {
    if (edge.memberKind === "user" && edge.memberUserEmail) {
      out.push({
        email: edge.memberUserEmail.trim().toLowerCase(),
        displayName: null,
        userId: edge.userId,
        sourceGroupId: groupId,
        sourceGroupEmail: meta.email,
        sourceGroupName: meta.name,
      });
    } else if (edge.memberKind === "group" && edge.memberNestedGroupId) {
      const [nested] = await db
        .select({ email: workspaceGroup.email, name: workspaceGroup.name })
        .from(workspaceGroup)
        .where(eq(workspaceGroup.id, edge.memberNestedGroupId))
        .limit(1);
      await collectUsersForGroup(
        edge.memberNestedGroupId,
        {
          email: nested?.email ?? edge.memberNestedGroupId,
          name: nested?.name ?? null,
        },
        visited,
        out,
      );
    }
  }
}

/** Membres utilisateurs des groupes d’audience (expansion récursive sous-groupes GW). */
export async function expandAudienceGroupMembers(
  groupIds: string[],
): Promise<ExpandedAudienceMember[]> {
  if (groupIds.length === 0) return [];

  const groups = await db
    .select({
      id: workspaceGroup.id,
      email: workspaceGroup.email,
      name: workspaceGroup.name,
    })
    .from(workspaceGroup)
    .where(inArray(workspaceGroup.id, groupIds));

  const raw: ExpandedAudienceMember[] = [];
  for (const g of groups) {
    await collectUsersForGroup(g.id, { email: g.email, name: g.name }, new Set(), raw);
  }

  const byEmail = new Map<string, ExpandedAudienceMember>();
  for (const m of raw) {
    const prev = byEmail.get(m.email);
    if (!prev) {
      byEmail.set(m.email, m);
      continue;
    }
    if (!prev.sourceGroupName && m.sourceGroupName) {
      byEmail.set(m.email, { ...prev, sourceGroupName: m.sourceGroupName });
    }
  }
  return [...byEmail.values()];
}

export async function loadAudienceGroupEmailsForEvent(eventId: string): Promise<Set<string>> {
  const rows = await db
    .select({ email: workspaceGroup.email })
    .from(agendaEventAudienceGroup)
    .innerJoin(workspaceGroup, eq(workspaceGroup.id, agendaEventAudienceGroup.workspaceGroupId))
    .where(eq(agendaEventAudienceGroup.eventId, eventId));
  return new Set(rows.map((r) => r.email.trim().toLowerCase()));
}

/** Supprime les lignes participant dont l’e-mail est un groupe (alias Calendar). */
export async function removeGroupAliasParticipants(eventId: string): Promise<void> {
  const groupEmails = await loadAudienceGroupEmailsForEvent(eventId);
  for (const email of groupEmails) {
    await db
      .delete(agendaEventParticipant)
      .where(
        and(
          eq(agendaEventParticipant.eventId, eventId),
          sql`lower(${agendaEventParticipant.email}) = ${email}`,
        ),
      );
  }
}

/** Crée des lignes participant pour chaque membre des groupes (RSVP existants conservés). */
export async function syncExpandedAudienceParticipants(eventId: string): Promise<void> {
  const groupRows = await db
    .select({ workspaceGroupId: agendaEventAudienceGroup.workspaceGroupId })
    .from(agendaEventAudienceGroup)
    .where(eq(agendaEventAudienceGroup.eventId, eventId));

  const groupIds = groupRows.map((r) => r.workspaceGroupId);
  const members = await expandAudienceGroupMembers(groupIds);

  for (const m of members) {
    const values = {
      id: crypto.randomUUID(),
      eventId,
      email: m.email,
      displayName: null,
      userId: m.userId,
      rsvpStatus: "pending" as const,
      role: "attendee" as const,
    };
    if (m.userId) {
      await db
        .insert(agendaEventParticipant)
        .values(values)
        .onConflictDoUpdate({
          target: [agendaEventParticipant.eventId, agendaEventParticipant.email],
          set: { userId: m.userId },
        });
    } else {
      await db.insert(agendaEventParticipant).values(values).onConflictDoNothing();
    }
  }

  await removeGroupAliasParticipants(eventId);
}
