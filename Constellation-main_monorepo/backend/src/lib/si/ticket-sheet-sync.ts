import { asc, eq } from "drizzle-orm";

import { db } from "../../db";
import {
  ticket,
  ticketAttachment,
  ticketComment,
  ticketStatusLog,
  ticketWatcher,
  type SiTicketStatus,
} from "../../db/schema";
import { appendHistorySheetRow, TICKETS_SHEET_HEADERS, upsertTicketSheetRow } from "../google-sheets";
import { resolveSheetExportActorUserId } from "./sheet-export-actor";
import { resolveTicketExportYear } from "./si-sheet-tabs";

const MAX_JSON_CELL = 48_000;

function jsonCell(value: unknown): string {
  const raw = JSON.stringify(value ?? null);
  if (raw.length <= MAX_JSON_CELL) return raw;
  return `${raw.slice(0, MAX_JSON_CELL)}…[tronqué]`;
}

async function buildTicketSheetRow(t: typeof ticket.$inferSelect) {
  const ticketId = t.id;

  const [comments, attachments, statusLog, watchers] = await Promise.all([
    db
      .select({
        id: ticketComment.id,
        userId: ticketComment.userId,
        body: ticketComment.body,
        createdAt: ticketComment.createdAt,
      })
      .from(ticketComment)
      .where(eq(ticketComment.ticketId, ticketId))
      .orderBy(asc(ticketComment.createdAt)),
    db
      .select({
        id: ticketAttachment.id,
        driveFileId: ticketAttachment.driveFileId,
        name: ticketAttachment.name,
        mimeType: ticketAttachment.mimeType,
        webViewLink: ticketAttachment.webViewLink,
        uploadedBy: ticketAttachment.uploadedBy,
        createdAt: ticketAttachment.createdAt,
      })
      .from(ticketAttachment)
      .where(eq(ticketAttachment.ticketId, ticketId))
      .orderBy(asc(ticketAttachment.createdAt)),
    db
      .select({
        id: ticketStatusLog.id,
        userId: ticketStatusLog.userId,
        fromStatus: ticketStatusLog.fromStatus,
        toStatus: ticketStatusLog.toStatus,
        comment: ticketStatusLog.comment,
        createdAt: ticketStatusLog.createdAt,
      })
      .from(ticketStatusLog)
      .where(eq(ticketStatusLog.ticketId, ticketId))
      .orderBy(asc(ticketStatusLog.createdAt)),
    db
      .select({
        userId: ticketWatcher.userId,
        createdAt: ticketWatcher.createdAt,
      })
      .from(ticketWatcher)
      .where(eq(ticketWatcher.ticketId, ticketId)),
  ]);

  const serializeDate = (d: Date) => d.toISOString();
  const commentsPayload = comments.map((c) => ({
    ...c,
    createdAt: serializeDate(c.createdAt),
  }));
  const attachmentsPayload = attachments.map((a) => ({
    ...a,
    createdAt: serializeDate(a.createdAt),
  }));
  const statusLogPayload = statusLog.map((s) => ({
    ...s,
    createdAt: serializeDate(s.createdAt),
  }));
  const watchersPayload = watchers.map((w) => ({
    ...w,
    createdAt: serializeDate(w.createdAt),
  }));

  const now = new Date().toISOString();

  return {
    reference: t.reference,
    ticket_id: t.id,
    title: t.title,
    status: t.status,
    category: t.category,
    creator_user_id: t.creatorUserId,
    assignee_user_id: t.assigneeUserId ?? "",
    created_at: t.createdAt.toISOString(),
    updated_at: t.updatedAt.toISOString(),
    closed_at: t.closedAt?.toISOString() ?? "",
    drive_folder_id: t.driveFolderId ?? "",
    drive_folder_url: t.driveFolderUrl ?? "",
    description: t.description.slice(0, 5000),
    audit_snapshot_json: jsonCell(t.auditSnapshot ?? []),
    comments_json: jsonCell(commentsPayload),
    attachments_json: jsonCell(attachmentsPayload),
    status_log_json: jsonCell(statusLogPayload),
    watchers_json: jsonCell(watchersPayload),
    last_exported_at: now,
  } satisfies Record<(typeof TICKETS_SHEET_HEADERS)[number], string>;
}

function logSheetFailure(context: string, ticketId: string, message: string) {
  console.error(`[si.sheet] ${context}`, { ticketId, message });
}

export async function syncTicketToSheet(
  actorUserId: string,
  ticketId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const sheetId = process.env.DRIVE_SI_TICKETS_SHEET_ID?.trim();
  if (!sheetId) {
    return { ok: false, message: "DRIVE_SI_TICKETS_SHEET_ID non configuré." };
  }

  const [t] = await db.select().from(ticket).where(eq(ticket.id, ticketId)).limit(1);
  if (!t) {
    return { ok: false, message: "ticket_not_found" };
  }

  const actor = await resolveSheetExportActorUserId(actorUserId);
  if (!("userId" in actor)) {
    logSheetFailure("actor", ticketId, actor.message);
    return { ok: false, message: actor.message };
  }

  const row = await buildTicketSheetRow(t);
  const year = resolveTicketExportYear(t.reference, t.createdAt);
  const res = await upsertTicketSheetRow(actor.userId, year, row);
  if (!res.ok) {
    logSheetFailure("upsert", ticketId, res.message);
    return res;
  }

  await db.update(ticket).set({ lastExportedAt: new Date() }).where(eq(ticket.id, ticketId));
  return { ok: true };
}

export async function exportAllTicketsToSheet(
  actorUserId: string,
  onProgress?: (pct: number, reference: string) => Promise<void>,
): Promise<{ exported: number; failed: number; errors: string[] }> {
  const sheetId = process.env.DRIVE_SI_TICKETS_SHEET_ID?.trim();
  if (!sheetId) {
    return { exported: 0, failed: 0, errors: ["DRIVE_SI_TICKETS_SHEET_ID non configuré."] };
  }

  const actor = await resolveSheetExportActorUserId(actorUserId);
  if (!("userId" in actor)) {
    return { exported: 0, failed: 0, errors: [actor.message] };
  }

  const rows = await db
    .select({ id: ticket.id, reference: ticket.reference })
    .from(ticket)
    .orderBy(asc(ticket.createdAt));

  let exported = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const { id, reference } = rows[i]!;
    if (onProgress) {
      await onProgress(Math.round(((i + 1) / rows.length) * 100), reference);
    }
    const res = await syncTicketToSheet(actor.userId, id);
    if (res.ok) {
      exported++;
    } else {
      failed++;
      errors.push(`${reference}: ${res.message}`);
    }
  }

  return { exported, failed, errors };
}

export async function appendTicketHistoryToSheet(
  actorUserId: string,
  input: {
    reference: string;
    eventKind: string;
    userId: string | null;
    detail: Record<string, unknown>;
  },
): Promise<void> {
  if (!process.env.DRIVE_SI_TICKETS_SHEET_ID?.trim()) return;

  const actor = await resolveSheetExportActorUserId(actorUserId);
  if (!("userId" in actor)) {
    logSheetFailure("history_actor", input.reference, actor.message);
    return;
  }

  const eventAt = new Date().toISOString();
  const res = await appendHistorySheetRow(actor.userId, eventAt, {
    reference: input.reference,
    event_at: eventAt,
    event_kind: input.eventKind,
    user_id: input.userId ?? "",
    detail_json: JSON.stringify(input.detail),
  });
  if (!res.ok) {
    logSheetFailure("history_append", input.reference, res.message);
  }
}

export async function exportTicketEvent(
  actorUserId: string,
  ticketId: string,
  eventKind: string,
  userId: string | null,
  detail: Record<string, unknown>,
): Promise<void> {
  const [t] = await db.select({ reference: ticket.reference }).from(ticket).where(eq(ticket.id, ticketId)).limit(1);
  if (!t) return;
  await appendTicketHistoryToSheet(actorUserId, {
    reference: t.reference,
    eventKind,
    userId,
    detail,
  });
  await syncTicketToSheet(actorUserId, ticketId);
}

export type { SiTicketStatus };
