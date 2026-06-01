import { and, count, eq, inArray } from "drizzle-orm";
import type { Hono as HonoType } from "hono";
import { Hono } from "hono";

import { db } from "../../db";
import {
  crmSprint,
  prospect,
  prospectStatusLog,
  sprintMember,
  sprintProspect,
  user as userTable,
} from "../../db/schema";
import { parseCrmImportFile } from "../../lib/crm/parse-crm-import-file";
import { runSprintProspectImport } from "../../lib/crm/prospect-import-run";
import { getUploadBlobFromFormData } from "../../lib/multipart-files";
import { assignRandomSprintProspects } from "../../lib/crm/sprint-assign-random";
import { patchSprintProspectFiche } from "../../lib/crm/sprint-prospect-patch";
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

/** Vérifie que l'user courant est membre ou créateur du sprint. */
async function canAccessSprint(userId: string, sprintId: string): Promise<boolean> {
  const [sprint] = await db
    .select({ id: crmSprint.id, isPublic: crmSprint.isPublic, createdBy: crmSprint.createdBy })
    .from(crmSprint)
    .where(eq(crmSprint.id, sprintId));
  if (!sprint) return false;
  if (sprint.isPublic || sprint.createdBy === userId) return true;
  const [member] = await db
    .select({ userId: sprintMember.userId })
    .from(sprintMember)
    .where(and(eq(sprintMember.sprintId, sprintId), eq(sprintMember.userId, userId)));
  return !!member;
}

/** Vérifie que l'user courant est créateur du sprint (pour gérer). */
async function isSprintManager(userId: string, sprintId: string): Promise<boolean> {
  const [sprint] = await db
    .select({ createdBy: crmSprint.createdBy })
    .from(crmSprint)
    .where(eq(crmSprint.id, sprintId));
  return sprint?.createdBy === userId;
}

export function registerCrmSprintRoutes(app: HonoType<{ Variables: AppVariables }>) {
  const r = new Hono<{ Variables: AppVariables }>();

  /** GET /sprints — liste des sprints accessibles */
  r.get("/sprints", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    if (!can(c, "crm.read")) return c.json({ error: "forbidden", need: "crm.read" }, 403);

    const userId = c.get("user")!.id;

    // Récupère tous les sprints (publics + créés par / membre de)
    const allSprints = await db.select().from(crmSprint).orderBy(crmSprint.dateStart);
    const memberships = await db
      .select({ sprintId: sprintMember.sprintId })
      .from(sprintMember)
      .where(eq(sprintMember.userId, userId));
    const memberOf = new Set(memberships.map((m) => m.sprintId));

    const visible = allSprints.filter(
      (s) => s.isPublic || s.createdBy === userId || memberOf.has(s.id),
    );

    // Enrichir avec le nombre de membres
    const sprintIds = visible.map((s) => s.id);
    const memberCountRows =
      sprintIds.length > 0
        ? await db
            .select({ sprintId: sprintMember.sprintId, cnt: count() })
            .from(sprintMember)
            .where(inArray(sprintMember.sprintId, sprintIds))
            .groupBy(sprintMember.sprintId)
        : [];
    const countMap = new Map(memberCountRows.map((r) => [r.sprintId, Number(r.cnt)]));

    const sprints = visible.map((s) => ({
      ...s,
      memberCount: countMap.get(s.id) ?? 0,
      isMember: memberOf.has(s.id),
      isCreator: s.createdBy === userId,
    }));

    return c.json({ sprints });
  });

  /** POST /sprints — créer un sprint */
  r.post("/sprints", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    if (!can(c, "crm.sprint.create"))
      return c.json({ error: "forbidden", need: "crm.sprint.create" }, 403);

    let body: Record<string, unknown>;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "invalid_json" }, 400);
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return c.json({ error: "name_required" }, 400);

    const dateStart = typeof body.dateStart === "string" ? new Date(body.dateStart) : null;
    const dateEnd = typeof body.dateEnd === "string" ? new Date(body.dateEnd) : null;
    if (!dateStart || Number.isNaN(dateStart.getTime()))
      return c.json({ error: "dateStart_invalid" }, 400);
    if (!dateEnd || Number.isNaN(dateEnd.getTime()))
      return c.json({ error: "dateEnd_invalid" }, 400);

    const id = Bun.randomUUIDv7();
    const userId = c.get("user")!.id;

    await db.insert(crmSprint).values({
      id,
      name,
      theme: typeof body.theme === "string" ? body.theme.trim() : undefined,
      dateStart,
      dateEnd,
      isPublic: body.isPublic === true,
      createdBy: userId,
    });

    // Le créateur est automatiquement membre
    await db.insert(sprintMember).values({ sprintId: id, userId }).onConflictDoNothing();

    const [created] = await db.select().from(crmSprint).where(eq(crmSprint.id, id));
    return c.json({ sprint: created }, 201);
  });

  /** GET /sprints/:id — détail sprint + membres + prospects */
  r.get("/sprints/:id", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    if (!can(c, "crm.read")) return c.json({ error: "forbidden", need: "crm.read" }, 403);

    const sprintId = c.req.param("id");
    const userId = c.get("user")!.id;

    const [sprint] = await db.select().from(crmSprint).where(eq(crmSprint.id, sprintId));
    if (!sprint) return c.json({ error: "not_found" }, 404);

    const hasAccess = await canAccessSprint(userId, sprintId);
    if (!hasAccess) return c.json({ error: "forbidden" }, 403);

    const isManager = can(c, "crm.sprint.manage") && (await isSprintManager(userId, sprintId));

    // Membres
    const memberRows = await db
      .select({
        userId: sprintMember.userId,
        joinedAt: sprintMember.joinedAt,
        name: userTable.name,
        email: userTable.email,
      })
      .from(sprintMember)
      .innerJoin(userTable, eq(sprintMember.userId, userTable.id))
      .where(eq(sprintMember.sprintId, sprintId));

    // Prospects : tout le sprint pour le gestionnaire ; sinon uniquement ceux assignés à l’utilisateur
    const prospectWhere = isManager
      ? eq(sprintProspect.sprintId, sprintId)
      : and(eq(sprintProspect.sprintId, sprintId), eq(sprintProspect.assignedUserId, userId));

    const spRows = await db
      .select({
        prospectId: sprintProspect.prospectId,
        assignedUserId: sprintProspect.assignedUserId,
        addedAt: sprintProspect.addedAt,
        nom: prospect.nom,
        prenom: prospect.prenom,
        email: prospect.email,
        telephone: prospect.telephone,
        entreprise: prospect.entreprise,
        secteur: prospect.secteur,
        source: prospect.source,
        statut: prospect.statut,
        linkedin: prospect.linkedin,
        notes: prospect.notes,
        updatedAt: prospect.updatedAt,
      })
      .from(sprintProspect)
      .innerJoin(prospect, eq(sprintProspect.prospectId, prospect.id))
      .where(prospectWhere);

    // Liste de tous les users (si manage) pour l'assignation
    let allUsers: { id: string; name: string; email: string }[] = [];
    if (isManager) {
      allUsers = await db
        .select({ id: userTable.id, name: userTable.name, email: userTable.email })
        .from(userTable);
    }

    return c.json({
      sprint: { ...sprint, isManager },
      members: memberRows,
      prospects: spRows,
      allUsers,
    });
  });

  /** PATCH /sprints/:id — modifier un sprint */
  r.patch("/sprints/:id", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    if (!can(c, "crm.sprint.manage"))
      return c.json({ error: "forbidden", need: "crm.sprint.manage" }, 403);

    const sprintId = c.req.param("id");
    const userId = c.get("user")!.id;

    const [existing] = await db.select().from(crmSprint).where(eq(crmSprint.id, sprintId));
    if (!existing) return c.json({ error: "not_found" }, 404);
    if (!(await isSprintManager(userId, sprintId))) return c.json({ error: "forbidden" }, 403);

    let body: Record<string, unknown>;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "invalid_json" }, 400);
    }

    const update: Partial<typeof crmSprint.$inferInsert> = {};
    if (typeof body.name === "string" && body.name.trim()) update.name = body.name.trim();
    if (typeof body.theme === "string") update.theme = body.theme.trim() || undefined;
    if (typeof body.dateStart === "string") {
      const d = new Date(body.dateStart);
      if (!Number.isNaN(d.getTime())) update.dateStart = d;
    }
    if (typeof body.dateEnd === "string") {
      const d = new Date(body.dateEnd);
      if (!Number.isNaN(d.getTime())) update.dateEnd = d;
    }
    if (typeof body.isPublic === "boolean") update.isPublic = body.isPublic;

    if (Object.keys(update).length > 0) {
      await db.update(crmSprint).set(update).where(eq(crmSprint.id, sprintId));
    }

    const [updated] = await db.select().from(crmSprint).where(eq(crmSprint.id, sprintId));
    return c.json({ sprint: updated });
  });

  /** DELETE /sprints/:id */
  r.delete("/sprints/:id", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    if (!can(c, "crm.sprint.manage"))
      return c.json({ error: "forbidden", need: "crm.sprint.manage" }, 403);

    const sprintId = c.req.param("id");
    const userId = c.get("user")!.id;

    const [existing] = await db
      .select({ id: crmSprint.id })
      .from(crmSprint)
      .where(eq(crmSprint.id, sprintId));
    if (!existing) return c.json({ error: "not_found" }, 404);
    if (!(await isSprintManager(userId, sprintId))) return c.json({ error: "forbidden" }, 403);

    await db.delete(crmSprint).where(eq(crmSprint.id, sprintId));
    return c.body(null, 204);
  });

  /** POST /sprints/:id/join — rejoindre un sprint public */
  r.post("/sprints/:id/join", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    if (!can(c, "crm.sprint.join"))
      return c.json({ error: "forbidden", need: "crm.sprint.join" }, 403);

    const sprintId = c.req.param("id");
    const userId = c.get("user")!.id;

    const [sprint] = await db
      .select({ isPublic: crmSprint.isPublic })
      .from(crmSprint)
      .where(eq(crmSprint.id, sprintId));
    if (!sprint) return c.json({ error: "not_found" }, 404);
    if (!sprint.isPublic) return c.json({ error: "sprint_not_public" }, 403);

    await db.insert(sprintMember).values({ sprintId, userId }).onConflictDoNothing();
    return c.json({ ok: true });
  });

  /** POST /sprints/:id/members — affecter des users (mode privé, crm.sprint.manage) */
  r.post("/sprints/:id/members", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    if (!can(c, "crm.sprint.manage"))
      return c.json({ error: "forbidden", need: "crm.sprint.manage" }, 403);

    const sprintId = c.req.param("id");
    const userId = c.get("user")!.id;

    const [sprint] = await db
      .select({ id: crmSprint.id })
      .from(crmSprint)
      .where(eq(crmSprint.id, sprintId));
    if (!sprint) return c.json({ error: "not_found" }, 404);
    if (!(await isSprintManager(userId, sprintId))) return c.json({ error: "forbidden" }, 403);

    let body: Record<string, unknown>;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "invalid_json" }, 400);
    }

    const userIds = Array.isArray(body.userIds)
      ? body.userIds.filter((x): x is string => typeof x === "string")
      : [];
    if (userIds.length === 0) return c.json({ error: "userIds_required" }, 400);

    for (const uid of userIds) {
      await db.insert(sprintMember).values({ sprintId, userId: uid }).onConflictDoNothing();
    }

    return c.json({ ok: true });
  });

  /** DELETE /sprints/:id/members/:userId — retirer un membre */
  r.delete("/sprints/:id/members/:memberId", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    if (!can(c, "crm.sprint.manage"))
      return c.json({ error: "forbidden", need: "crm.sprint.manage" }, 403);

    const sprintId = c.req.param("id");
    const memberId = c.req.param("memberId");
    const userId = c.get("user")!.id;

    if (!(await isSprintManager(userId, sprintId))) return c.json({ error: "forbidden" }, 403);

    await db
      .delete(sprintMember)
      .where(and(eq(sprintMember.sprintId, sprintId), eq(sprintMember.userId, memberId)));
    return c.body(null, 204);
  });

  /** POST /sprints/:id/prospects — ajouter des prospects au sprint */
  r.post("/sprints/:id/prospects", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    if (!can(c, "crm.sprint.manage"))
      return c.json({ error: "forbidden", need: "crm.sprint.manage" }, 403);

    const sprintId = c.req.param("id");
    const userId = c.get("user")!.id;

    const [sprint] = await db
      .select({ id: crmSprint.id })
      .from(crmSprint)
      .where(eq(crmSprint.id, sprintId));
    if (!sprint) return c.json({ error: "not_found" }, 404);
    if (!(await isSprintManager(userId, sprintId))) return c.json({ error: "forbidden" }, 403);

    let body: Record<string, unknown>;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "invalid_json" }, 400);
    }

    // Import via fichier xlsx/csv attaché dans la même requête (prospectIds existants OU nouveaux prospects)
    const prospectIds = Array.isArray(body.prospectIds)
      ? body.prospectIds.filter((x): x is string => typeof x === "string")
      : [];
    const assignedUserId =
      typeof body.assignedUserId === "string" ? body.assignedUserId : undefined;

    if (prospectIds.length === 0) return c.json({ error: "prospectIds_required" }, 400);

    for (const pid of prospectIds) {
      await db
        .insert(sprintProspect)
        .values({
          sprintId,
          prospectId: pid,
          assignedUserId: assignedUserId ?? null,
        })
        .onConflictDoNothing();
    }

    return c.json({ ok: true, added: prospectIds.length });
  });

  /** POST /sprints/:id/prospects/import — import fichier dans un sprint (+ ajout global) */
  r.post("/sprints/:id/prospects/import", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    if (!can(c, "crm.sprint.manage"))
      return c.json({ error: "forbidden", need: "crm.sprint.manage" }, 403);

    const sprintId = c.req.param("id");
    const userId = c.get("user")!.id;

    const [sprint] = await db
      .select({ id: crmSprint.id })
      .from(crmSprint)
      .where(eq(crmSprint.id, sprintId));
    if (!sprint) return c.json({ error: "not_found" }, 404);
    if (!(await isSprintManager(userId, sprintId))) return c.json({ error: "forbidden" }, 403);

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
    const assignedUserId = formData.get("assignedUserId");

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

    const result = await runSprintProspectImport({
      rows,
      userId,
      sprintId,
      assignedUserId: typeof assignedUserId === "string" ? assignedUserId : null,
    });
    return c.json(result);
  });

  /**
   * POST /sprints/:id/prospects/assign-random
   * Répartition aléatoire des prospects du sprint parmi les **membres** du sprint.
   * Body : { scope?: "unassigned" | "all" } — défaut "unassigned".
   */
  r.post("/sprints/:id/prospects/assign-random", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    if (!can(c, "crm.sprint.manage"))
      return c.json({ error: "forbidden", need: "crm.sprint.manage" }, 403);

    const sprintId = c.req.param("id");
    const userId = c.get("user")!.id;

    const [sprint] = await db
      .select({ id: crmSprint.id })
      .from(crmSprint)
      .where(eq(crmSprint.id, sprintId));
    if (!sprint) return c.json({ error: "not_found" }, 404);
    if (!(await isSprintManager(userId, sprintId))) return c.json({ error: "forbidden" }, 403);

    let body: Record<string, unknown> = {};
    try {
      body = await c.req.json();
    } catch {
      body = {};
    }
    const scope = body.scope === "all" ? "all" : "unassigned";

    const result = await assignRandomSprintProspects(sprintId, scope);
    if (!result.ok) return c.json({ error: result.error }, 400);

    return c.json({ updated: result.updated, scope: result.scope });
  });

  /** PATCH /sprints/:id/prospects/:prospectId — fiche + statut (assigné ou manager) */
  r.patch("/sprints/:id/prospects/:prospectId", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;

    const sprintId = c.req.param("id");
    const prospectId = c.req.param("prospectId");
    const userId = c.get("user")!.id;

    const [link] = await db
      .select()
      .from(sprintProspect)
      .where(and(eq(sprintProspect.sprintId, sprintId), eq(sprintProspect.prospectId, prospectId)));

    if (!link) return c.json({ error: "not_found" }, 404);

    const isManager = can(c, "crm.sprint.manage") && (await isSprintManager(userId, sprintId));
    const isAssigned = link.assignedUserId === userId;

    if (!isManager && !isAssigned) {
      return c.json({ error: "forbidden" }, 403);
    }

    let body: Record<string, unknown>;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "invalid_json" }, 400);
    }

    const result = await patchSprintProspectFiche({
      sprintId,
      prospectId,
      userId,
      body,
      isManager,
      isAssigned,
    });
    if (!result.ok) return c.json(result.body, result.status as 400 | 404 | 413);
    return c.json({ prospect: result.prospect, updated: result.updated });
  });

  app.route("/api/app/crm", r);
}
