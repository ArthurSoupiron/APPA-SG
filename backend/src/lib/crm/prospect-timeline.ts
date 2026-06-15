import { and, desc, eq } from "drizzle-orm";

import { db } from "../../db";
import { contactEvent, crmAuditLog, prospectNote, prospectStatusLog, user } from "../../db/schema";

export type ProspectTimelineEntry =
  | {
      id: string;
      at: string;
      type: "status_change";
      userId: string | null;
      userName: string | null;
      oldStatus: string | null;
      newStatus: string;
    }
  | {
      id: string;
      at: string;
      type: "note";
      userId: string | null;
      userName: string | null;
      body: string;
    }
  | {
      id: string;
      at: string;
      type: "contact_event";
      userId: string | null;
      userName: string | null;
      kind: string;
      metadata: Record<string, unknown> | null;
    }
  | {
      id: string;
      at: string;
      type: "audit";
      userId: string | null;
      userName: string | null;
      action: string;
      payload: Record<string, unknown> | null;
    };

export async function buildProspectTimeline(prospectId: string): Promise<ProspectTimelineEntry[]> {
  const [statusRows, noteRows, eventRows, auditRows] = await Promise.all([
    db
      .select({
        id: prospectStatusLog.id,
        createdAt: prospectStatusLog.createdAt,
        userId: prospectStatusLog.userId,
        userName: user.name,
        oldStatus: prospectStatusLog.oldStatus,
        newStatus: prospectStatusLog.newStatus,
      })
      .from(prospectStatusLog)
      .leftJoin(user, eq(prospectStatusLog.userId, user.id))
      .where(eq(prospectStatusLog.prospectId, prospectId))
      .orderBy(desc(prospectStatusLog.createdAt)),
    db
      .select({
        id: prospectNote.id,
        createdAt: prospectNote.createdAt,
        userId: prospectNote.userId,
        userName: user.name,
        body: prospectNote.body,
      })
      .from(prospectNote)
      .leftJoin(user, eq(prospectNote.userId, user.id))
      .where(eq(prospectNote.prospectId, prospectId))
      .orderBy(desc(prospectNote.createdAt)),
    db
      .select({
        id: contactEvent.id,
        createdAt: contactEvent.createdAt,
        userId: contactEvent.userId,
        userName: user.name,
        kind: contactEvent.kind,
        metadata: contactEvent.metadata,
      })
      .from(contactEvent)
      .leftJoin(user, eq(contactEvent.userId, user.id))
      .where(eq(contactEvent.prospectId, prospectId))
      .orderBy(desc(contactEvent.createdAt)),
    db
      .select({
        id: crmAuditLog.id,
        createdAt: crmAuditLog.createdAt,
        userId: crmAuditLog.userId,
        userName: user.name,
        action: crmAuditLog.action,
        payload: crmAuditLog.payload,
      })
      .from(crmAuditLog)
      .leftJoin(user, eq(crmAuditLog.userId, user.id))
      .where(and(eq(crmAuditLog.entityType, "prospect"), eq(crmAuditLog.entityId, prospectId)))
      .orderBy(desc(crmAuditLog.createdAt)),
  ]);

  const timeline: ProspectTimelineEntry[] = [
    ...statusRows.map((r) => ({
      id: r.id,
      at: r.createdAt.toISOString(),
      type: "status_change" as const,
      userId: r.userId,
      userName: r.userName,
      oldStatus: r.oldStatus,
      newStatus: r.newStatus,
    })),
    ...noteRows.map((r) => ({
      id: r.id,
      at: r.createdAt.toISOString(),
      type: "note" as const,
      userId: r.userId,
      userName: r.userName,
      body: r.body,
    })),
    ...eventRows.map((r) => ({
      id: r.id,
      at: r.createdAt.toISOString(),
      type: "contact_event" as const,
      userId: r.userId,
      userName: r.userName,
      kind: r.kind,
      metadata: r.metadata,
    })),
    ...auditRows.map((r) => ({
      id: r.id,
      at: r.createdAt.toISOString(),
      type: "audit" as const,
      userId: r.userId,
      userName: r.userName,
      action: r.action,
      payload: r.payload,
    })),
  ];

  timeline.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
  return timeline;
}
