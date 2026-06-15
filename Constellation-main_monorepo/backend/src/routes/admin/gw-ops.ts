import { and, asc, desc, eq, gt, inArray, isNull, lte, or } from "drizzle-orm";
import type { Hono as HonoType } from "hono";
import { Hono } from "hono";

import { db } from "../../db";
import {
  asyncJob,
  systemBanner,
  workspaceGroup,
  workspaceGroupMember,
  workspaceGroupPermission,
} from "../../db/schema";
import { GW_DIRECTORY_SYNC_KIND, startGwDirectorySyncJob } from "../../lib/gw-directory-sync";
import type { AppVariables } from "../../types/app";
import { isSuperAdminUserId, normalizeStoredPermissions, validatePermissionList } from "../../ubac";
import { denyUnlessSuperAdmin } from "./ubac-admin";

function denyUnlessAuthenticated(c: {
  get: (k: "user") => AppVariables["user"];
  json: (b: unknown, s: number) => Response;
}): Response | null {
  const u = c.get("user");
  if (!u) return c.json({ error: "unauthorized" }, 401);
  return null;
}

export function registerGwOpsRoutes(app: HonoType<{ Variables: AppVariables }>) {
  const status = new Hono<{ Variables: AppVariables }>();

  status.get("/banner", async (c) => {
    const denied = denyUnlessAuthenticated(c);
    if (denied) return denied;
    const u = c.get("user")!;
    const now = new Date();
    const isSuper = isSuperAdminUserId(u.id);

    const banners = await db
      .select()
      .from(systemBanner)
      .where(
        and(
          eq(systemBanner.isActive, true),
          lte(systemBanner.startsAt, now),
          or(isNull(systemBanner.endsAt), gt(systemBanner.endsAt, now)),
        ),
      )
      .orderBy(asc(systemBanner.startsAt));

    const jobWhere = isSuper
      ? inArray(asyncJob.status, ["queued", "running"])
      : and(inArray(asyncJob.status, ["queued", "running"]), eq(asyncJob.visibleToAll, true));

    const jobs = await db
      .select()
      .from(asyncJob)
      .where(jobWhere)
      .orderBy(desc(asyncJob.startedAt))
      .limit(25);

    return c.json({
      banners: banners.map((b) => ({
        id: b.id,
        title: b.title,
        body: b.body,
        severity: b.severity,
        startsAt: b.startsAt.toISOString(),
        endsAt: b.endsAt?.toISOString() ?? null,
      })),
      jobs: jobs.map((j) => ({
        id: j.id,
        kind: j.kind,
        status: j.status,
        progress: j.progress,
        label: j.label,
        detail: j.detail,
        startedAt: j.startedAt.toISOString(),
        finishedAt: j.finishedAt?.toISOString() ?? null,
        error: j.error,
        visibleToAll: j.visibleToAll,
      })),
    });
  });

  app.route("/api/app/status", status);

  const adminGw = new Hono<{ Variables: AppVariables }>();

  adminGw.post("/sync", async (c) => {
    const denied = denyUnlessSuperAdmin(c);
    if (denied) return denied;
    const u = c.get("user")!;
    const jobId = crypto.randomUUID();
    await db.insert(asyncJob).values({
      id: jobId,
      kind: GW_DIRECTORY_SYNC_KIND,
      status: "queued",
      label: "Synchronisation Google Workspace",
      visibleToAll: true,
      createdBy: u.id,
    });
    queueMicrotask(() => startGwDirectorySyncJob(jobId, u.id));
    return c.json({ jobId }, 202);
  });

  adminGw.get("/jobs", async (c) => {
    const denied = denyUnlessSuperAdmin(c);
    if (denied) return denied;
    const rows = await db.select().from(asyncJob).orderBy(desc(asyncJob.startedAt)).limit(50);
    return c.json({
      jobs: rows.map((j) => ({
        id: j.id,
        kind: j.kind,
        status: j.status,
        progress: j.progress,
        label: j.label,
        detail: j.detail,
        startedAt: j.startedAt.toISOString(),
        finishedAt: j.finishedAt?.toISOString() ?? null,
        error: j.error,
        visibleToAll: j.visibleToAll,
        createdBy: j.createdBy,
      })),
    });
  });

  adminGw.get("/data", async (c) => {
    const denied = denyUnlessSuperAdmin(c);
    if (denied) return denied;
    const groups = await db.select().from(workspaceGroup).orderBy(asc(workspaceGroup.email));
    const members = await db
      .select()
      .from(workspaceGroupMember)
      .orderBy(asc(workspaceGroupMember.containerGroupId));

    return c.json({
      groups,
      members,
    });
  });

  adminGw.get("/group-permissions", async (c) => {
    const denied = denyUnlessSuperAdmin(c);
    if (denied) return denied;
    const groups = await db.select().from(workspaceGroup).orderBy(asc(workspaceGroup.email));
    const permRows = await db.select().from(workspaceGroupPermission);
    const byGroup = new Map<string, string[]>();
    for (const row of permRows) {
      const list = byGroup.get(row.workspaceGroupId) ?? [];
      list.push(row.permission);
      byGroup.set(row.workspaceGroupId, list);
    }
    return c.json({
      groups: groups.map((g) => ({
        id: g.id,
        email: g.email,
        name: g.name,
        syncedAt: g.syncedAt.toISOString(),
        permissions: normalizeStoredPermissions(byGroup.get(g.id) ?? []),
      })),
    });
  });

  adminGw.put("/group-permissions/:groupId", async (c) => {
    const denied = denyUnlessSuperAdmin(c);
    if (denied) return denied;
    const groupId = c.req.param("groupId");
    const [g] = await db
      .select({ id: workspaceGroup.id })
      .from(workspaceGroup)
      .where(eq(workspaceGroup.id, groupId))
      .limit(1);
    if (!g) return c.json({ error: "not_found" }, 404);
    let body: { permissions?: unknown };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "invalid_json" }, 400);
    }
    const perms = validatePermissionList(body.permissions ?? []);
    if (perms === null) return c.json({ error: "invalid_permissions" }, 400);
    await db.transaction(async (tx) => {
      await tx
        .delete(workspaceGroupPermission)
        .where(eq(workspaceGroupPermission.workspaceGroupId, groupId));
      if (perms.length > 0) {
        await tx
          .insert(workspaceGroupPermission)
          .values(perms.map((permission) => ({ workspaceGroupId: groupId, permission })));
      }
    });
    return c.json({ ok: true, permissions: perms });
  });

  app.route("/api/app/admin/gw", adminGw);

  const adminBanners = new Hono<{ Variables: AppVariables }>();

  adminBanners.get("/", async (c) => {
    const denied = denyUnlessSuperAdmin(c);
    if (denied) return denied;
    const rows = await db.select().from(systemBanner).orderBy(desc(systemBanner.createdAt));
    return c.json({
      banners: rows.map((b) => ({
        id: b.id,
        title: b.title,
        body: b.body,
        severity: b.severity,
        isActive: b.isActive,
        startsAt: b.startsAt.toISOString(),
        endsAt: b.endsAt?.toISOString() ?? null,
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
        createdBy: b.createdBy,
      })),
    });
  });

  adminBanners.post("/", async (c) => {
    const denied = denyUnlessSuperAdmin(c);
    if (denied) return denied;
    const u = c.get("user")!;
    let body: {
      title?: string;
      body?: string;
      severity?: string;
      isActive?: boolean;
      startsAt?: string;
      endsAt?: string | null;
    };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "invalid_json" }, 400);
    }
    if (
      typeof body.title !== "string" ||
      typeof body.body !== "string" ||
      typeof body.severity !== "string"
    ) {
      return c.json({ error: "validation_error" }, 400);
    }
    if (!["info", "warning", "critical"].includes(body.severity)) {
      return c.json({ error: "invalid_severity" }, 400);
    }
    const id = crypto.randomUUID();
    const startsAt = typeof body.startsAt === "string" ? new Date(body.startsAt) : new Date();
    const endsAt =
      body.endsAt === null || body.endsAt === undefined
        ? null
        : typeof body.endsAt === "string"
          ? new Date(body.endsAt)
          : null;
    await db.insert(systemBanner).values({
      id,
      title: body.title,
      body: body.body,
      severity: body.severity,
      isActive: body.isActive !== false,
      startsAt,
      endsAt,
      createdBy: u.id,
    });
    return c.json({ id }, 201);
  });

  adminBanners.patch("/:id", async (c) => {
    const denied = denyUnlessSuperAdmin(c);
    if (denied) return denied;
    const id = c.req.param("id");
    let patch: Partial<{
      title: string;
      body: string;
      severity: string;
      isActive: boolean;
      startsAt: string;
      endsAt: string | null;
    }>;
    try {
      patch = await c.req.json();
    } catch {
      return c.json({ error: "invalid_json" }, 400);
    }
    const updates: Record<string, unknown> = {};
    if (typeof patch.title === "string") updates.title = patch.title;
    if (typeof patch.body === "string") updates.body = patch.body;
    if (typeof patch.severity === "string") {
      if (!["info", "warning", "critical"].includes(patch.severity)) {
        return c.json({ error: "invalid_severity" }, 400);
      }
      updates.severity = patch.severity;
    }
    if (typeof patch.isActive === "boolean") updates.isActive = patch.isActive;
    if (typeof patch.startsAt === "string") updates.startsAt = new Date(patch.startsAt);
    if (patch.endsAt === null) updates.endsAt = null;
    else if (typeof patch.endsAt === "string") updates.endsAt = new Date(patch.endsAt);
    if (Object.keys(updates).length === 0) {
      return c.json({ error: "no_updates" }, 400);
    }
    const [row] = await db
      .update(systemBanner)
      .set(updates as never)
      .where(eq(systemBanner.id, id))
      .returning();
    if (!row) return c.json({ error: "not_found" }, 404);
    return c.json({ ok: true });
  });

  adminBanners.delete("/:id", async (c) => {
    const denied = denyUnlessSuperAdmin(c);
    if (denied) return denied;
    const id = c.req.param("id");
    const [row] = await db.delete(systemBanner).where(eq(systemBanner.id, id)).returning();
    if (!row) return c.json({ error: "not_found" }, 404);
    return c.json({ ok: true });
  });

  app.route("/api/app/admin/banners", adminBanners);
}
