import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";
import type { Context, Hono as HonoType } from "hono";
import { Hono } from "hono";

import { db } from "../../db";
import {
  SI_TICKET_CATEGORIES,
  SI_TICKET_STATUSES,
  asyncJob,
  ticket,
  ticketAttachment,
  ticketComment,
  ticketNotification,
  ticketStatusLog,
  ticketWatcher,
  type SiTicketCategory,
  type SiTicketStatus,
} from "../../db/schema";
import { buildAuditSnapshotForUser, recordAppAudit } from "../../lib/app-audit";
import { parseUploadFilesFromFormData } from "../../lib/multipart-files";
import {
  uploadFileToSiTicketFolder,
  ensureSiTicketFolderPath,
} from "../../lib/si-drive";
import {
  canAgentTransition,
  canParticipantInteract,
} from "../../lib/si/ticket-status";
import { allocateTicketReference } from "../../lib/si/ticket-reference";
import {
  canEditTicketMeta,
  canViewTicket,
  getTicketOrNull,
  isTicketAgent,
} from "../../lib/si/ticket-access";
import {
  ensureCreatorWatcher,
  notifyTicketWatchers,
} from "../../lib/si/ticket-notifications";
import {
  serializeTicketDetail,
  serializeTicketListItems,
} from "../../lib/si/ticket-serialize";
import {
  exportAllTicketsToSheet,
  exportTicketEvent,
  syncTicketToSheet,
} from "../../lib/si/ticket-sheet-sync";
import {
  runSiTicketSheetRecovery,
  SI_TICKET_SHEET_RECOVERY_KIND,
} from "../../lib/si/ticket-sheet-recovery";
import { can } from "../../lib/ubac-http";
import { isSuperAdminUserId } from "../../ubac";
import type { AppVariables } from "../../types/app";

function denyUnlessAuthenticated(c: {
  get: (k: "user") => AppVariables["user"];
  json: (b: unknown, s: number) => Response;
}): Response | null {
  const u = c.get("user");
  if (!u) return c.json({ error: "unauthorized" }, 401);
  return null;
}

const MAX_TITLE = 200;
const MAX_DESCRIPTION = 32_000;
const MAX_COMMENT = 16_000;

export function registerSiTicketRoutes(
  app: HonoType<{ Variables: AppVariables }>,
) {
  const router = new Hono<{ Variables: AppVariables }>();

  router.get("/notifications", async (c) => {
    const denied = denyUnlessAuthenticated(c);
    if (denied) return denied;
    const user = c.get("user")!;
    const rows = await db
      .select()
      .from(ticketNotification)
      .where(eq(ticketNotification.userId, user.id))
      .orderBy(desc(ticketNotification.createdAt))
      .limit(50);
    return c.json({
      notifications: rows.map((n) => ({
        id: n.id,
        ticketId: n.ticketId,
        kind: n.kind,
        payload: n.payload,
        readAt: n.readAt?.toISOString() ?? null,
        createdAt: n.createdAt.toISOString(),
      })),
    });
  });

  router.post("/notifications/read", async (c) => {
    const denied = denyUnlessAuthenticated(c);
    if (denied) return denied;
    const user = c.get("user")!;
    const body = (await c.req.json().catch(() => null)) as {
      ids?: string[];
    } | null;
    const ids = Array.isArray(body?.ids)
      ? body.ids.filter((x) => typeof x === "string")
      : [];
    if (ids.length > 0) {
      const now = new Date();
      await db
        .update(ticketNotification)
        .set({ readAt: now })
        .where(
          and(
            eq(ticketNotification.userId, user.id),
            inArray(ticketNotification.id, ids),
          ),
        );
    }
    return c.json({ ok: true });
  });

  router.get("/manage", async (c) => {
    const denied = denyUnlessAuthenticated(c);
    if (denied) return denied;
    if (!can(c, "si.ticket.manage")) {
      return c.json({ error: "forbidden", need: "si.ticket.manage" }, 403);
    }
    return listTickets(c, { all: true });
  });

  router.post("/recovery/import", async (c) => startRecoveryImport(c));
  router.post("/recovery/export", async (c) => startRecoveryExport(c));

  router.get("/", async (c) => listTickets(c, { mine: true }));

  router.post("/", async (c) => createTicket(c));

  router.get("/:id", async (c) => getTicket(c));

  router.patch("/:id", async (c) => patchTicket(c));

  router.post("/:id/comments", async (c) => addComment(c));

  router.post("/:id/attachments", async (c) => addAttachment(c));

  router.post("/:id/watchers", async (c) => toggleWatcher(c));

  app.route("/api/app/si/tickets", router);
}

type SiCtx = Context<{ Variables: AppVariables }>;

function ticketIdParam(c: SiCtx): string | Response {
  const id = c.req.param("id");
  if (!id) return c.json({ error: "bad_request" }, 400);
  return id;
}

async function listTickets(c: SiCtx, opts: { mine?: boolean; all?: boolean }) {
  const denied = denyUnlessAuthenticated(c);
  if (denied) return denied;
  const user = c.get("user")!;

  const status = c.req.query("status")?.trim();
  const q = c.req.query("q")?.trim();

  const conditions = [];
  if (opts.mine) {
    conditions.push(eq(ticket.creatorUserId, user.id));
  }
  if (status && SI_TICKET_STATUSES.includes(status as SiTicketStatus)) {
    conditions.push(eq(ticket.status, status));
  }
  if (q) {
    conditions.push(
      or(
        ilike(ticket.title, `%${q}%`),
        ilike(ticket.reference, `%${q}%`),
        ilike(ticket.description, `%${q}%`),
      ),
    );
  }

  const rows = await db
    .select()
    .from(ticket)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(ticket.updatedAt))
    .limit(100);

  const items = await serializeTicketListItems(rows);
  return c.json({ tickets: items });
}

async function createTicket(c: SiCtx) {
  const denied = denyUnlessAuthenticated(c);
  if (denied) return denied;
  const user = c.get("user")!;

  const contentType = c.req.header("content-type") ?? "";
  let title = "";
  let description = "";
  let category: SiTicketCategory = "autre";
  let files: Awaited<ReturnType<typeof parseUploadFilesFromFormData>> = [];

  if (contentType.includes("multipart/form-data")) {
    let formData: FormData;
    try {
      formData = await c.req.formData();
    } catch {
      return c.json({ error: "multipart_expected" }, 400);
    }
    title = String(formData.get("title") ?? "").trim();
    description = String(formData.get("description") ?? "").trim();
    const cat = String(formData.get("category") ?? "autre").trim();
    if (SI_TICKET_CATEGORIES.includes(cat as SiTicketCategory)) {
      category = cat as SiTicketCategory;
    }
    files = await parseUploadFilesFromFormData(formData, "files");
  } else {
    const body = (await c.req.json().catch(() => null)) as {
      title?: string;
      description?: string;
      category?: string;
    } | null;
    title = body?.title?.trim() ?? "";
    description = body?.description?.trim() ?? "";
    const cat = body?.category?.trim() ?? "autre";
    if (SI_TICKET_CATEGORIES.includes(cat as SiTicketCategory)) {
      category = cat as SiTicketCategory;
    }
  }

  if (!title || title.length > MAX_TITLE) {
    return c.json({ error: "invalid_title" }, 400);
  }
  if (!description || description.length > MAX_DESCRIPTION) {
    return c.json({ error: "invalid_description" }, 400);
  }

  const createdAt = new Date();
  const reference = await allocateTicketReference(createdAt);
  const ticketId = Bun.randomUUIDv7();
  const auditSnapshot = await buildAuditSnapshotForUser(user.id);

  const driveRes = await ensureSiTicketFolderPath(
    user.id,
    reference,
    title,
    createdAt,
  );
  if (!driveRes.ok) {
    return c.json(
      { error: driveRes.code ?? "drive_error", message: driveRes.message },
      502,
    );
  }

  await db.insert(ticket).values({
    id: ticketId,
    reference,
    title,
    description,
    status: "open",
    category,
    creatorUserId: user.id,
    driveFolderId: driveRes.folder.folderId,
    driveFolderUrl: driveRes.folder.folderUrl,
    auditSnapshot,
    createdAt,
    updatedAt: createdAt,
  });

  await db.insert(ticketStatusLog).values({
    id: Bun.randomUUIDv7(),
    ticketId,
    userId: user.id,
    fromStatus: null,
    toStatus: "open",
    comment: "Création du ticket",
  });

  await ensureCreatorWatcher(ticketId, user.id);

  const uploadWarnings: string[] = [];
  for (const file of files) {
    const up = await uploadFileToSiTicketFolder(
      user.id,
      driveRes.folder.folderId,
      file,
    );
    if (up.ok) {
      await db.insert(ticketAttachment).values({
        id: Bun.randomUUIDv7(),
        ticketId,
        driveFileId: up.driveFileId,
        name: up.name,
        mimeType: up.mimeType,
        webViewLink: up.webViewLink,
        uploadedBy: user.id,
      });
    } else {
      uploadWarnings.push(`${file.name}: ${up.message}`);
      console.error("[si.ticket] upload create failed", file.name, up.message);
    }
  }

  await recordAppAudit({
    userId: user.id,
    action: "si.ticket.create",
    resourceType: "si.ticket",
    resourceId: ticketId,
    payload: { reference, title },
    requestPath: c.req.path,
  });

  queueMicrotask(() => {
    void exportTicketEvent(user.id, ticketId, "created", user.id, {
      reference,
      title,
    });
  });

  const detail = await serializeTicketDetail(ticketId);
  return c.json({ ...detail, uploadWarnings }, 201);
}

async function getTicket(c: SiCtx) {
  const denied = denyUnlessAuthenticated(c);
  if (denied) return denied;
  const idOrRes = ticketIdParam(c);
  if (idOrRes instanceof Response) return idOrRes;
  const id = idOrRes;
  const row = await getTicketOrNull(id);
  if (!row) return c.json({ error: "not_found" }, 404);
  if (!canViewTicket(c, row)) return c.json({ error: "forbidden" }, 403);

  const detail = await serializeTicketDetail(id);
  return c.json(detail);
}

async function patchTicket(c: SiCtx) {
  const denied = denyUnlessAuthenticated(c);
  if (denied) return denied;
  const user = c.get("user")!;
  const idOrRes = ticketIdParam(c);
  if (idOrRes instanceof Response) return idOrRes;
  const id = idOrRes;
  const row = await getTicketOrNull(id);
  if (!row) return c.json({ error: "not_found" }, 404);
  if (!canViewTicket(c, row)) return c.json({ error: "forbidden" }, 403);

  const body = (await c.req.json().catch(() => null)) as {
    title?: string;
    description?: string;
    status?: string;
    assigneeUserId?: string | null;
  } | null;

  const agent = isTicketAgent(c);
  const updates: Partial<typeof ticket.$inferInsert> = {};

  if (body?.title !== undefined || body?.description !== undefined) {
    if (!canEditTicketMeta(c, row)) {
      return c.json({ error: "forbidden" }, 403);
    }
    if (body.title !== undefined) {
      const t = body.title.trim();
      if (!t || t.length > MAX_TITLE)
        return c.json({ error: "invalid_title" }, 400);
      updates.title = t;
    }
    if (body.description !== undefined) {
      const d = body.description.trim();
      if (!d || d.length > MAX_DESCRIPTION)
        return c.json({ error: "invalid_description" }, 400);
      updates.description = d;
    }
  }

  if (body?.status !== undefined) {
    if (!agent)
      return c.json({ error: "forbidden", need: "si.ticket.manage" }, 403);
    const to = body.status as SiTicketStatus;
    if (!SI_TICKET_STATUSES.includes(to))
      return c.json({ error: "invalid_status" }, 400);
    const from = row.status as SiTicketStatus;
    if (!canAgentTransition(from, to)) {
      return c.json({ error: "invalid_transition", from, to }, 400);
    }
    updates.status = to;
    if (to === "closed" || to === "cancelled") {
      updates.closedAt = new Date();
    } else if (from === "closed" || from === "cancelled") {
      updates.closedAt = null;
    }
    await db.insert(ticketStatusLog).values({
      id: Bun.randomUUIDv7(),
      ticketId: id,
      userId: user.id,
      fromStatus: from,
      toStatus: to,
    });
    await notifyTicketWatchers({
      ticketId: id,
      kind: "status_change",
      payload: { from, to, reference: row.reference },
      excludeUserId: user.id,
    });
    queueMicrotask(() => {
      void exportTicketEvent(user.id, id, "status_change", user.id, {
        from,
        to,
      });
    });
  }

  if (body?.assigneeUserId !== undefined) {
    if (!agent)
      return c.json({ error: "forbidden", need: "si.ticket.manage" }, 403);
    updates.assigneeUserId = body.assigneeUserId;
    if (body.assigneeUserId && row.status === "open") {
      updates.status = "in_progress";
      await db.insert(ticketStatusLog).values({
        id: Bun.randomUUIDv7(),
        ticketId: id,
        userId: user.id,
        fromStatus: "open",
        toStatus: "in_progress",
        comment: "Attribution",
      });
    }
    await notifyTicketWatchers({
      ticketId: id,
      kind: "assigned",
      payload: {
        assigneeUserId: body.assigneeUserId,
        reference: row.reference,
      },
      excludeUserId: user.id,
    });
    queueMicrotask(() => {
      void exportTicketEvent(user.id, id, "assigned", user.id, {
        assigneeUserId: body.assigneeUserId,
      });
    });
  }

  if (Object.keys(updates).length === 0) {
    return c.json({ error: "no_changes" }, 400);
  }

  await db.update(ticket).set(updates).where(eq(ticket.id, id));
  queueMicrotask(() => void syncTicketToSheet(user.id, id));

  const detail = await serializeTicketDetail(id);
  return c.json(detail);
}

async function addComment(c: SiCtx) {
  const denied = denyUnlessAuthenticated(c);
  if (denied) return denied;
  const user = c.get("user")!;
  const idOrRes = ticketIdParam(c);
  if (idOrRes instanceof Response) return idOrRes;
  const id = idOrRes;
  const row = await getTicketOrNull(id);
  if (!row) return c.json({ error: "not_found" }, 404);
  if (!canViewTicket(c, row)) return c.json({ error: "forbidden" }, 403);
  if (!canParticipantInteract(row.status as SiTicketStatus)) {
    return c.json({ error: "ticket_closed" }, 400);
  }

  const body = (await c.req.json().catch(() => null)) as {
    body?: string;
  } | null;
  const text = body?.body?.trim() ?? "";
  if (!text || text.length > MAX_COMMENT)
    return c.json({ error: "invalid_comment" }, 400);

  const commentId = Bun.randomUUIDv7();
  await db.insert(ticketComment).values({
    id: commentId,
    ticketId: id,
    userId: user.id,
    body: text,
  });

  await notifyTicketWatchers({
    ticketId: id,
    kind: "comment",
    payload: { reference: row.reference, preview: text.slice(0, 200) },
    excludeUserId: user.id,
  });

  queueMicrotask(() => {
    void exportTicketEvent(user.id, id, "comment", user.id, {
      body: text.slice(0, 500),
    });
  });

  const detail = await serializeTicketDetail(id);
  return c.json(detail);
}

async function addAttachment(c: SiCtx) {
  const denied = denyUnlessAuthenticated(c);
  if (denied) return denied;
  const user = c.get("user")!;
  const idOrRes = ticketIdParam(c);
  if (idOrRes instanceof Response) return idOrRes;
  const id = idOrRes;
  const row = await getTicketOrNull(id);
  if (!row) return c.json({ error: "not_found" }, 404);
  if (!canViewTicket(c, row)) return c.json({ error: "forbidden" }, 403);
  if (!canParticipantInteract(row.status as SiTicketStatus)) {
    return c.json({ error: "ticket_closed" }, 400);
  }
  if (!row.driveFolderId) {
    return c.json({ error: "no_drive_folder" }, 400);
  }

  let formData: FormData;
  try {
    formData = await c.req.formData();
  } catch {
    return c.json({ error: "multipart_expected" }, 400);
  }

  const parsed = await parseUploadFilesFromFormData(formData, "files");
  if (parsed.length === 0) {
    return c.json({ error: "no_files", message: "Aucun fichier reçu." }, 400);
  }

  const uploaded: string[] = [];
  const uploadWarnings: string[] = [];
  for (const file of parsed) {
    const up = await uploadFileToSiTicketFolder(
      user.id,
      row.driveFolderId,
      file,
    );
    if (up.ok) {
      const attId = Bun.randomUUIDv7();
      await db.insert(ticketAttachment).values({
        id: attId,
        ticketId: id,
        driveFileId: up.driveFileId,
        name: up.name,
        mimeType: up.mimeType,
        webViewLink: up.webViewLink,
        uploadedBy: user.id,
      });
      uploaded.push(attId);
    } else {
      uploadWarnings.push(`${file.name}: ${up.message}`);
      console.error(
        "[si.ticket] upload attachment failed",
        file.name,
        up.message,
      );
    }
  }

  if (uploaded.length === 0) {
    return c.json(
      {
        error: "upload_failed",
        message: uploadWarnings.join(" ; ") || "Échec Drive.",
      },
      502,
    );
  }

  queueMicrotask(() => {
    void exportTicketEvent(user.id, id, "attachment", user.id, {
      count: uploaded.length,
    });
  });

  const detail = await serializeTicketDetail(id);
  return c.json({ ...detail, uploadWarnings });
}

async function toggleWatcher(c: SiCtx) {
  const denied = denyUnlessAuthenticated(c);
  if (denied) return denied;
  const user = c.get("user")!;
  const idOrRes = ticketIdParam(c);
  if (idOrRes instanceof Response) return idOrRes;
  const id = idOrRes;
  const row = await getTicketOrNull(id);
  if (!row) return c.json({ error: "not_found" }, 404);
  if (!canViewTicket(c, row)) return c.json({ error: "forbidden" }, 403);

  const body = (await c.req.json().catch(() => null)) as {
    watch?: boolean;
  } | null;
  const watch = body?.watch !== false;

  if (watch) {
    await db
      .insert(ticketWatcher)
      .values({ ticketId: id, userId: user.id })
      .onConflictDoNothing();
  } else {
    await db
      .delete(ticketWatcher)
      .where(
        and(eq(ticketWatcher.ticketId, id), eq(ticketWatcher.userId, user.id)),
      );
  }

  return c.json({ watching: watch });
}

export const SI_TICKET_SHEET_EXPORT_KIND = "si.ticket_sheet_export";

async function startRecoveryImport(c: SiCtx) {
  const denied = denyUnlessAuthenticated(c);
  if (denied) return denied;
  const user = c.get("user")!;
  if (!can(c, "si.ticket.manage") && !isSuperAdminUserId(user.id)) {
    return c.json({ error: "forbidden" }, 403);
  }

  const jobId = crypto.randomUUID();
  await db.insert(asyncJob).values({
    id: jobId,
    kind: SI_TICKET_SHEET_RECOVERY_KIND,
    status: "queued",
    label: "Réimport tickets SI depuis Google Sheet",
    visibleToAll: false,
    createdBy: user.id,
  });

  queueMicrotask(() => runRecoveryImportJob(jobId, user.id));

  return c.json({ jobId }, 202);
}

async function startRecoveryExport(c: SiCtx) {
  const denied = denyUnlessAuthenticated(c);
  if (denied) return denied;
  const user = c.get("user")!;
  if (!can(c, "si.ticket.manage") && !isSuperAdminUserId(user.id)) {
    return c.json({ error: "forbidden" }, 403);
  }

  const jobId = crypto.randomUUID();
  await db.insert(asyncJob).values({
    id: jobId,
    kind: SI_TICKET_SHEET_EXPORT_KIND,
    status: "queued",
    label: "Export backup tickets SI vers Google Sheet",
    visibleToAll: false,
    createdBy: user.id,
  });

  queueMicrotask(() => runRecoveryExportJob(jobId, user.id));

  return c.json({ jobId }, 202);
}

async function runRecoveryImportJob(jobId: string, userId: string) {
  await db
    .update(asyncJob)
    .set({ status: "running", progress: 0 })
    .where(eq(asyncJob.id, jobId));

  try {
    const result = await runSiTicketSheetRecovery(
      userId,
      async (pct, label) => {
        await db
          .update(asyncJob)
          .set({ progress: pct, detail: { label } })
          .where(eq(asyncJob.id, jobId));
      },
    );
    await db
      .update(asyncJob)
      .set({
        status: "succeeded",
        progress: 100,
        finishedAt: new Date(),
        detail: result,
      })
      .where(eq(asyncJob.id, jobId));
  } catch (e) {
    await db
      .update(asyncJob)
      .set({
        status: "failed",
        finishedAt: new Date(),
        error: e instanceof Error ? e.message : String(e),
      })
      .where(eq(asyncJob.id, jobId));
  }
}

async function runRecoveryExportJob(jobId: string, userId: string) {
  await db
    .update(asyncJob)
    .set({ status: "running", progress: 0 })
    .where(eq(asyncJob.id, jobId));

  try {
    const result = await exportAllTicketsToSheet(userId, async (pct, label) => {
      await db
        .update(asyncJob)
        .set({ progress: pct, detail: { label } })
        .where(eq(asyncJob.id, jobId));
    });

    const sheetsApiDisabled = result.errors.some(
      (e) =>
        e.includes("sheets.googleapis.com") &&
        /disabled|not been used/i.test(e),
    );
    const jobFailed =
      (result.exported === 0 && result.failed > 0) ||
      (result.exported === 0 && result.errors.length > 0);

    await db
      .update(asyncJob)
      .set({
        status: jobFailed ? "failed" : "succeeded",
        progress: 100,
        finishedAt: new Date(),
        detail: result,
        error: jobFailed
          ? sheetsApiDisabled
            ? "API Google Sheets désactivée sur le projet Google Cloud (OAuth). Activez « Google Sheets API » dans la console GCP du client OAuth, attendez 1–2 min, puis relancez l’export."
            : (result.errors[0] ?? `${result.failed} ticket(s) non exporté(s).`)
          : null,
      })
      .where(eq(asyncJob.id, jobId));
  } catch (e) {
    await db
      .update(asyncJob)
      .set({
        status: "failed",
        finishedAt: new Date(),
        error: e instanceof Error ? e.message : String(e),
      })
      .where(eq(asyncJob.id, jobId));
  }
}
