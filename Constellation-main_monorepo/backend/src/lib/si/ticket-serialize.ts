import { asc, eq, inArray } from "drizzle-orm";

import { db } from "../../db";
import {
  ticket,
  ticketAttachment,
  ticketComment,
  ticketStatusLog,
  user,
} from "../../db/schema";

type UserRow = { id: string; name: string | null; email: string | null };

function toTicketUser(row: UserRow | undefined) {
  if (!row) return null;
  return { id: row.id, name: row.name, email: row.email };
}

export async function serializeTicketDetail(ticketId: string) {
  const [t] = await db.select().from(ticket).where(eq(ticket.id, ticketId)).limit(1);
  if (!t) return null;

  const userIds = new Set<string>([t.creatorUserId]);
  if (t.assigneeUserId) userIds.add(t.assigneeUserId);

  const [statusLogs, comments, attachments] = await Promise.all([
    db
      .select()
      .from(ticketStatusLog)
      .where(eq(ticketStatusLog.ticketId, ticketId))
      .orderBy(asc(ticketStatusLog.createdAt)),
    db
      .select()
      .from(ticketComment)
      .where(eq(ticketComment.ticketId, ticketId))
      .orderBy(asc(ticketComment.createdAt)),
    db
      .select()
      .from(ticketAttachment)
      .where(eq(ticketAttachment.ticketId, ticketId))
      .orderBy(asc(ticketAttachment.createdAt)),
  ]);

  for (const s of statusLogs) {
    if (s.userId) userIds.add(s.userId);
  }
  for (const c of comments) {
    if (c.userId) userIds.add(c.userId);
  }
  for (const a of attachments) {
    if (a.uploadedBy) userIds.add(a.uploadedBy);
  }

  const users =
    userIds.size > 0
      ? await db
          .select({ id: user.id, name: user.name, email: user.email })
          .from(user)
          .where(inArray(user.id, [...userIds]))
      : [];

  const userMap = new Map(users.map((u) => [u.id, u]));

  return {
    ticket: {
      id: t.id,
      reference: t.reference,
      title: t.title,
      description: t.description,
      status: t.status,
      category: t.category,
      creatorUserId: t.creatorUserId,
      assigneeUserId: t.assigneeUserId,
      driveFolderId: t.driveFolderId,
      driveFolderUrl: t.driveFolderUrl,
      auditSnapshot: t.auditSnapshot,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      closedAt: t.closedAt?.toISOString() ?? null,
      creator: userMap.get(t.creatorUserId) ?? null,
      assignee: t.assigneeUserId ? (userMap.get(t.assigneeUserId) ?? null) : null,
    },
    statusLogs: statusLogs.map((s) => ({
      id: s.id,
      fromStatus: s.fromStatus,
      toStatus: s.toStatus,
      comment: s.comment,
      createdAt: s.createdAt.toISOString(),
      user: s.userId ? (userMap.get(s.userId) ?? null) : null,
    })),
    comments: comments.map((c) => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt.toISOString(),
      user: c.userId ? (userMap.get(c.userId) ?? null) : null,
    })),
    attachments: attachments.map((a) => ({
      id: a.id,
      driveFileId: a.driveFileId,
      name: a.name,
      mimeType: a.mimeType,
      webViewLink: a.webViewLink,
      createdAt: a.createdAt.toISOString(),
      uploader: a.uploadedBy ? (userMap.get(a.uploadedBy) ?? null) : null,
    })),
  };
}

export async function serializeTicketListItems(rows: (typeof ticket.$inferSelect)[]) {
  if (rows.length === 0) return [];

  const userIds = new Set<string>();
  for (const r of rows) {
    userIds.add(r.creatorUserId);
    if (r.assigneeUserId) userIds.add(r.assigneeUserId);
  }

  const users =
    userIds.size > 0
      ? await db
          .select({ id: user.id, name: user.name, email: user.email })
          .from(user)
          .where(inArray(user.id, [...userIds]))
      : [];

  const userMap = new Map(users.map((u) => [u.id, u]));

  return rows.map((t) => ({
    id: t.id,
    reference: t.reference,
    title: t.title,
    status: t.status,
    category: t.category,
    creatorUserId: t.creatorUserId,
    assigneeUserId: t.assigneeUserId,
    driveFolderUrl: t.driveFolderUrl,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    creator: toTicketUser(userMap.get(t.creatorUserId)),
    assignee: t.assigneeUserId ? toTicketUser(userMap.get(t.assigneeUserId)) : null,
  }));
}

/** @deprecated Préférer serializeTicketListItems pour les listes */
export async function serializeTicketListItem(t: typeof ticket.$inferSelect) {
  const [item] = await serializeTicketListItems([t]);
  return item!;
}
