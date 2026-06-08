import { eq } from "drizzle-orm";

import { db } from "../../db";
import {
  SI_TICKET_CATEGORIES,
  SI_TICKET_STATUSES,
  ticket,
  ticketStatusLog,
} from "../../db/schema";
import { readAllTicketBackupTabs, TICKETS_SHEET_HEADERS } from "../google-sheets";

const CATEGORY_SET = new Set<string>(SI_TICKET_CATEGORIES);
const STATUS_SET = new Set<string>(SI_TICKET_STATUSES);

function rowToRecord(headers: string[], values: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < headers.length; i++) {
    out[headers[i] ?? `col_${i}`] = values[i] ?? "";
  }
  return out;
}

async function importTicketRow(
  actorUserId: string,
  rec: Record<string, string>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const reference = rec.reference?.trim();
  if (!reference) {
    return { ok: false, error: "reference_vide" };
  }

  const status = rec.status?.trim() || "open";
  const category = rec.category?.trim() || "autre";
  if (!STATUS_SET.has(status)) {
    return { ok: false, error: `statut invalide ${status}` };
  }
  if (!CATEGORY_SET.has(category)) {
    return { ok: false, error: `catégorie invalide ${category}` };
  }

  let auditSnapshot: Record<string, unknown>[] | null = null;
  if (rec.audit_snapshot_json) {
    try {
      auditSnapshot = JSON.parse(rec.audit_snapshot_json) as Record<string, unknown>[];
    } catch {
      auditSnapshot = null;
    }
  }

  const createdAt = rec.created_at ? new Date(rec.created_at) : new Date();
  const updatedAt = rec.updated_at ? new Date(rec.updated_at) : createdAt;
  const closedAt = rec.closed_at ? new Date(rec.closed_at) : null;

  const [existing] = await db
    .select({ id: ticket.id })
    .from(ticket)
    .where(eq(ticket.reference, reference))
    .limit(1);

  if (existing) {
    await db
      .update(ticket)
      .set({
        title: rec.title || reference,
        description: rec.description || "",
        status,
        category,
        creatorUserId: rec.creator_user_id || actorUserId,
        assigneeUserId: rec.assignee_user_id || null,
        driveFolderUrl: rec.drive_folder_url || null,
        auditSnapshot,
        updatedAt,
        closedAt,
      })
      .where(eq(ticket.id, existing.id));
    return { ok: true };
  }

  const id = rec.ticket_id?.trim() || Bun.randomUUIDv7();
  await db.insert(ticket).values({
    id,
    reference,
    title: rec.title || reference,
    description: rec.description || "",
    status,
    category,
    creatorUserId: rec.creator_user_id || actorUserId,
    assigneeUserId: rec.assignee_user_id || null,
    driveFolderUrl: rec.drive_folder_url || null,
    auditSnapshot,
    createdAt,
    updatedAt,
    closedAt,
  });
  await db.insert(ticketStatusLog).values({
    id: Bun.randomUUIDv7(),
    ticketId: id,
    userId: actorUserId,
    fromStatus: null,
    toStatus: status,
    comment: "Import recovery Sheet",
  });
  return { ok: true };
}

export async function runSiTicketSheetRecovery(
  actorUserId: string,
  onProgress?: (pct: number, label: string) => Promise<void>,
): Promise<{ imported: number; skipped: number; errors: string[] }> {
  const ticketsRes = await readAllTicketBackupTabs(actorUserId);
  if (!ticketsRes.ok) {
    return { imported: 0, skipped: 0, errors: [ticketsRes.message] };
  }

  if (ticketsRes.tabs.length === 0) {
    return { imported: 0, skipped: 0, errors: ["Aucun onglet tickets-AAAA trouvé."] };
  }

  const allRows: { tab: string; rec: Record<string, string> }[] = [];
  for (const { tab, rows } of ticketsRes.tabs) {
    if (rows.length < 2) continue;
    const headers = rows[0] ?? [];
    const normalizedHeaders =
      headers.length > 0 ? headers : [...TICKETS_SHEET_HEADERS];
    for (let i = 1; i < rows.length; i++) {
      allRows.push({
        tab,
        rec: rowToRecord(normalizedHeaders, rows[i] ?? []),
      });
    }
  }

  if (allRows.length === 0) {
    return { imported: 0, skipped: 0, errors: [] };
  }

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < allRows.length; i++) {
    const { tab, rec } = allRows[i]!;
    const reference = rec.reference?.trim();
    if (onProgress) {
      await onProgress(
        Math.round(((i + 1) / allRows.length) * 100),
        reference ? `${tab} · ${reference}` : tab,
      );
    }
    if (!reference) {
      skipped++;
      continue;
    }

    const result = await importTicketRow(actorUserId, rec);
    if (result.ok) {
      imported++;
    } else {
      errors.push(`${tab} · ${reference}: ${result.error}`);
      skipped++;
    }
  }

  return { imported, skipped, errors };
}

export const SI_TICKET_SHEET_RECOVERY_KIND = "si.ticket_sheet_recovery";
