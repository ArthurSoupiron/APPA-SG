import { and, asc, count, desc, eq, ilike, inArray, isNull, notInArray, or } from "drizzle-orm";
import ExcelJS from "exceljs";
import type { Hono as HonoType } from "hono";
import { Hono } from "hono";

import { db } from "../../db";
import type { ProspectStatus } from "../../db/schema";
import {
  CONTACT_EVENT_KINDS,
  type ContactEventKind,
  contactEvent,
  crmAuditLog,
  prospect,
  prospectNote,
  prospectStatusLog,
  sprintProspect,
} from "../../db/schema";
import {
  contactEventMetadataExceedsLimit,
  prospectNoteBodyExceedsLimit,
} from "../../lib/crm/prospect-field-limits";
import {
  APOLLO_PROSPECT_FIELD_DEFS,
  prospectStringFieldsFromBody,
} from "../../lib/crm/apollo-prospect-fields";
import { parseCrmImportFile } from "../../lib/crm/parse-crm-import-file";
import { runGlobalProspectImport } from "../../lib/crm/prospect-import-run";
import { isValidProspectStatus } from "../../lib/crm/prospect-import-parse";
import { getUploadBlobFromFormData } from "../../lib/multipart-files";
import {
  insertProspectFicheFieldAudit,
  insertProspectNoteFromNotesPatch,
} from "../../lib/crm/prospect-patch-side-effects";
import { buildProspectTimeline } from "../../lib/crm/prospect-timeline";
import {
  CRM_IMPORT_MAX_BYTES,
  CRM_IMPORT_MAX_ROWS,
  importFileTooLargeMessage,
  importTooManyRowsMessage,
} from "../../lib/import-file-limits";
import { can } from "../../lib/ubac-http";
import type { AppVariables } from "../../types/app";

function requireUser(c: {
  get: (k: "user") => AppVariables["user"];
  json: (b: unknown, s: number) => Response;
}) {
  const u = c.get("user");
  if (!u) return c.json({ error: "unauthorized" }, 401);
  return null;
}

/** Aligné sur `CRM_SECTEUR_SELECT_EMPTY` côté web (`web/lib/crm-secteurs.ts`). */
const CRM_SECTEUR_EMPTY_SENTINEL = "__crm_secteur_empty__";

function isContactEventKind(s: unknown): s is ContactEventKind {
  return typeof s === "string" && (CONTACT_EVENT_KINDS as readonly string[]).includes(s);
}

export function registerCrmProspectRoutes(app: HonoType<{ Variables: AppVariables }>) {
  const r = new Hono<{ Variables: AppVariables }>();

  /** GET /prospects — liste paginée + filtres */
  r.get("/prospects", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    if (!can(c, "crm.read")) return c.json({ error: "forbidden", need: "crm.read" }, 403);

    const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10));
    const pageSize = Math.min(500, Math.max(1, parseInt(c.req.query("pageSize") ?? "50", 10)));
    const q = c.req.query("q")?.trim() ?? "";
    const statut = c.req.query("statut") ?? "";
    const statutsParam = c.req.query("statuts")?.trim() ?? "";
    const secteur = c.req.query("secteur")?.trim() ?? "";
    const secteurExact =
      c.req.query("secteurExact") === "1" || c.req.query("secteurExact") === "true";
    const excludeSprintId = c.req.query("excludeSprintId")?.trim() ?? "";

    const conditions = [];
    if (q) {
      conditions.push(
        or(
          ilike(prospect.nom, `%${q}%`),
          ilike(prospect.prenom, `%${q}%`),
          ilike(prospect.email, `%${q}%`),
          ilike(prospect.entreprise, `%${q}%`),
        ),
      );
    }
    if (statutsParam) {
      const list = statutsParam
        .split(",")
        .map((s) => s.trim())
        .filter((s): s is ProspectStatus => isValidProspectStatus(s));
      if (list.length > 0) conditions.push(inArray(prospect.statut, list));
    } else if (statut && isValidProspectStatus(statut)) {
      conditions.push(eq(prospect.statut, statut));
    }
    if (secteur) {
      if (secteurExact && secteur === CRM_SECTEUR_EMPTY_SENTINEL) {
        conditions.push(or(isNull(prospect.secteur), eq(prospect.secteur, "")));
      } else if (secteurExact) {
        conditions.push(eq(prospect.secteur, secteur));
      } else {
        conditions.push(ilike(prospect.secteur, `%${secteur}%`));
      }
    }
    if (excludeSprintId) {
      const inSprint = db
        .select({ pid: sprintProspect.prospectId })
        .from(sprintProspect)
        .where(eq(sprintProspect.sprintId, excludeSprintId));
      conditions.push(notInArray(prospect.id, inSprint));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [rows, countRows] = await Promise.all([
      db
        .select()
        .from(prospect)
        .where(where)
        .orderBy(desc(prospect.updatedAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db.select({ total: count() }).from(prospect).where(where),
    ]);

    const total = Number(countRows[0]?.total ?? 0);
    return c.json({ prospects: rows, total, page, pageSize });
  });

  /** GET /prospects/export?format=csv|xlsx */
  r.get("/prospects/export", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    if (!can(c, "crm.read")) return c.json({ error: "forbidden", need: "crm.read" }, 403);

    const format = c.req.query("format") === "xlsx" ? "xlsx" : "csv";
    const rows = await db.select().from(prospect).orderBy(asc(prospect.nom));

    const data = rows.map((p) => {
      const base: Record<string, string> = {
        id: p.id,
        nom: p.nom,
        prenom: p.prenom ?? "",
        email: p.email ?? "",
        telephone: p.telephone ?? "",
        linkedin: p.linkedin ?? "",
        entreprise: p.entreprise ?? "",
        secteur: p.secteur ?? "",
        source: p.source ?? "",
        statut: p.statut,
        notes: p.notes ?? "",
        created_at: p.createdAt.toISOString(),
      };
      for (const { key } of APOLLO_PROSPECT_FIELD_DEFS) {
        const v = p[key];
        base[key] = typeof v === "string" ? v : "";
      }
      return base;
    });

    if (format === "xlsx") {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Prospects");

      const columns = Object.keys(data[0] ?? {});
      if (columns.length > 0) {
        worksheet.addRow(columns);
        data.forEach((row) => {
          worksheet.addRow(columns.map((key) => row[key as keyof typeof row]));
        });
      }

      const buf = await workbook.xlsx.writeBuffer();
      return new Response(buf, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="prospects.xlsx"`,
        },
      });
    }

    // CSV
    const headers = Object.keys(data[0] ?? {}).join(",");
    const csvLines = data.map((r) =>
      Object.values(r)
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const csv = [headers, ...csvLines].join("\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="prospects.csv"`,
      },
    });
  });

  /** POST /prospects/:id/notes — ajout append-only + concat dans prospect.notes */
  r.post("/prospects/:id/notes", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    if (!can(c, "crm.write")) return c.json({ error: "forbidden", need: "crm.write" }, 403);

    const id = c.req.param("id");
    const [existing] = await db.select().from(prospect).where(eq(prospect.id, id));
    if (!existing) return c.json({ error: "not_found" }, 404);

    let body: Record<string, unknown>;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "invalid_json" }, 400);
    }
    const text = typeof body.body === "string" ? body.body.trim() : "";
    if (!text) return c.json({ error: "body_required" }, 400);
    if (prospectNoteBodyExceedsLimit(text)) {
      return c.json({ error: "body_too_large" }, 413);
    }

    const userId = c.get("user")!.id;
    const noteId = Bun.randomUUIDv7();
    const prev = (existing.notes ?? "").trim();
    const next = prev ? `${prev}\n\n${text}` : text;

    await db.insert(prospectNote).values({
      id: noteId,
      prospectId: id,
      userId,
      body: text,
    });
    await db.update(prospect).set({ notes: next }).where(eq(prospect.id, id));

    const timeline = await buildProspectTimeline(id);
    const [updated] = await db.select().from(prospect).where(eq(prospect.id, id));
    return c.json({ prospect: updated, timeline }, 201);
  });

  /** POST /prospects/:id/contact-events */
  r.post("/prospects/:id/contact-events", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    if (!can(c, "crm.write")) return c.json({ error: "forbidden", need: "crm.write" }, 403);

    const id = c.req.param("id");
    const [existing] = await db
      .select({ id: prospect.id })
      .from(prospect)
      .where(eq(prospect.id, id));
    if (!existing) return c.json({ error: "not_found" }, 404);

    let body: Record<string, unknown>;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "invalid_json" }, 400);
    }
    if (!isContactEventKind(body.kind)) return c.json({ error: "invalid_kind" }, 400);
    const metadata =
      body.metadata !== undefined && body.metadata !== null && typeof body.metadata === "object"
        ? (body.metadata as Record<string, unknown>)
        : null;
    if (contactEventMetadataExceedsLimit(metadata)) {
      return c.json({ error: "metadata_too_large" }, 413);
    }

    const userId = c.get("user")!.id;
    const eventId = Bun.randomUUIDv7();
    await db.insert(contactEvent).values({
      id: eventId,
      prospectId: id,
      userId,
      kind: body.kind,
      metadata,
    });

    const timeline = await buildProspectTimeline(id);
    const [p] = await db.select().from(prospect).where(eq(prospect.id, id));
    return c.json({ prospect: p, timeline }, 201);
  });

  /** GET /prospects/:id */
  r.get("/prospects/:id", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    if (!can(c, "crm.read")) return c.json({ error: "forbidden", need: "crm.read" }, 403);

    const id = c.req.param("id");
    const rows = await db.select().from(prospect).where(eq(prospect.id, id));
    if (rows.length === 0) return c.json({ error: "not_found" }, 404);
    const timeline = await buildProspectTimeline(id);
    return c.json({ prospect: rows[0], timeline });
  });

  /** POST /prospects */
  r.post("/prospects", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    if (!can(c, "crm.write")) return c.json({ error: "forbidden", need: "crm.write" }, 403);

    let body: Record<string, unknown>;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "invalid_json" }, 400);
    }

    const nom = typeof body.nom === "string" ? body.nom.trim() : "";
    if (!nom) return c.json({ error: "nom_required" }, 400);

    const statut = isValidProspectStatus(body.statut) ? body.statut : "a_contacter";
    const id = Bun.randomUUIDv7();
    const userId = c.get("user")!.id;
    const fields = prospectStringFieldsFromBody(body);

    await db.insert(prospect).values({
      id,
      ...fields,
      nom,
      statut,
      createdBy: userId,
    });

    // Log initial status
    await db.insert(prospectStatusLog).values({
      id: Bun.randomUUIDv7(),
      prospectId: id,
      userId,
      oldStatus: null,
      newStatus: statut,
    });

    const notesTrim =
      typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : undefined;
    if (notesTrim && prospectNoteBodyExceedsLimit(notesTrim)) {
      return c.json({ error: "notes_too_large" }, 413);
    }
    if (notesTrim) {
      await db.insert(prospectNote).values({
        id: Bun.randomUUIDv7(),
        prospectId: id,
        userId,
        body: notesTrim,
      });
    }

    await db.insert(crmAuditLog).values({
      id: Bun.randomUUIDv7(),
      entityType: "prospect",
      entityId: id,
      userId,
      action: "create",
      payload: { nom },
    });

    const [created] = await db.select().from(prospect).where(eq(prospect.id, id));
    return c.json({ prospect: created }, 201);
  });

  /** PATCH /prospects/:id */
  r.patch("/prospects/:id", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    if (!can(c, "crm.write")) return c.json({ error: "forbidden", need: "crm.write" }, 403);

    const id = c.req.param("id");
    const [existing] = await db.select().from(prospect).where(eq(prospect.id, id));
    if (!existing) return c.json({ error: "not_found" }, 404);

    let body: Record<string, unknown>;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "invalid_json" }, 400);
    }

    const update: Partial<typeof prospect.$inferInsert> = prospectStringFieldsFromBody(body);
    if (typeof body.nom === "string") update.nom = body.nom.trim();

    let statusChanged = false;
    if (isValidProspectStatus(body.statut) && body.statut !== existing.statut) {
      update.statut = body.statut;
      statusChanged = true;
    }

    if (Object.keys(update).length === 0) return c.json({ error: "nothing_to_update" }, 400);

    if (typeof body.notes === "string") {
      const n = body.notes.trim();
      if (n.length > 0 && prospectNoteBodyExceedsLimit(n)) {
        return c.json({ error: "notes_too_large" }, 413);
      }
    }

    await db.update(prospect).set(update).where(eq(prospect.id, id));

    if (statusChanged) {
      await db.insert(prospectStatusLog).values({
        id: Bun.randomUUIDv7(),
        prospectId: id,
        userId: c.get("user")!.id,
        oldStatus: existing.statut,
        newStatus: update.statut!,
      });
    }

    const actorId = c.get("user")!.id;
    if (typeof body.notes === "string") {
      await insertProspectNoteFromNotesPatch(body.notes, existing, id, actorId);
    }
    await insertProspectFicheFieldAudit(existing, update, id, actorId);

    const timeline = await buildProspectTimeline(id);
    const [updated] = await db.select().from(prospect).where(eq(prospect.id, id));
    return c.json({ prospect: updated, timeline });
  });

  /** DELETE /prospects/:id */
  r.delete("/prospects/:id", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    if (!can(c, "crm.delete")) return c.json({ error: "forbidden", need: "crm.delete" }, 403);

    const id = c.req.param("id");
    const [existing] = await db
      .select({ id: prospect.id })
      .from(prospect)
      .where(eq(prospect.id, id));
    if (!existing) return c.json({ error: "not_found" }, 404);

    await db.delete(prospect).where(eq(prospect.id, id));
    return c.body(null, 204);
  });

  /** POST /prospects/import — multipart file (.csv, .tsv, .xlsx) */
  r.post("/prospects/import", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    if (!can(c, "crm.write")) return c.json({ error: "forbidden", need: "crm.write" }, 403);

    const userId = c.get("user")!.id;
    let formData: FormData;
    try {
      formData = await c.req.formData();
    } catch {
      return c.json({ error: "multipart_expected" }, 400);
    }

    const file = getUploadBlobFromFormData(formData, "file");
    if (!file) return c.json({ error: "file_required" }, 400);
    if (file.size > CRM_IMPORT_MAX_BYTES) {
      return c.json(
        {
          error: "file_too_large",
          message: importFileTooLargeMessage(CRM_IMPORT_MAX_BYTES),
        },
        413,
      );
    }

    const parsed = await parseCrmImportFile(file);
    if (!parsed.ok) {
      return c.json(
        { error: parsed.error, message: parsed.message },
        parsed.status as 400 | 422,
      );
    }
    const { rows } = parsed;

    if (rows.length === 0) return c.json({ error: "empty_file" }, 400);
    if (rows.length > CRM_IMPORT_MAX_ROWS) {
      return c.json(
        {
          error: "too_many_rows",
          message: importTooManyRowsMessage(CRM_IMPORT_MAX_ROWS),
        },
        400,
      );
    }

    const result = await runGlobalProspectImport({ rows, userId });
    return c.json(result);
  });

  app.route("/api/app/crm", r);
}
