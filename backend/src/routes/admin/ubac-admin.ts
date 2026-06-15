import { asc, inArray } from "drizzle-orm";
import type { Hono as HonoType } from "hono";
import { Hono } from "hono";

import { db } from "../../db";
import { user as userTable, workspaceGroup, workspaceGroupPermission } from "../../db/schema";
import { getWorkspaceGroupIdsByEmailLowerBatch } from "../../lib/gw-group-membership";
import type { AppVariables } from "../../types/app";
import { buildPermissionAdminSections, permissionCatalogEntries } from "../../ubac-display";
import { allPermissions, isSuperAdminUserId, normalizeStoredPermissions } from "../../ubac";

export function denyUnlessSuperAdmin(c: {
  get: (k: "user") => AppVariables["user"];
  json: (b: unknown, s: number) => Response;
}): Response | null {
  const u = c.get("user");
  if (!u) return c.json({ error: "unauthorized" }, 401);
  if (!isSuperAdminUserId(u.id)) return c.json({ error: "forbidden" }, 403);
  return null;
}

/**
 * Catalogue permissions + récap membres / groupes Google (super-admin).
 */
export function registerUbacAdminRoutes(app: HonoType<{ Variables: AppVariables }>) {
  const r = new Hono<{ Variables: AppVariables }>();

  r.get("/catalog", (c) => {
    const denied = denyUnlessSuperAdmin(c);
    if (denied) return denied;
    return c.json({
      permissions: allPermissions(),
      catalog: permissionCatalogEntries(),
      sections: buildPermissionAdminSections(),
    });
  });

  r.get("/users", async (c) => {
    const denied = denyUnlessSuperAdmin(c);
    if (denied) return denied;
    const userRows = await db
      .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
      })
      .from(userTable)
      .orderBy(asc(userTable.name));

    const emailsLowerUnique = [
      ...new Set(userRows.map((row) => (row.email ?? "").trim().toLowerCase())),
    ];
    const groupIdsByEmailLower = await getWorkspaceGroupIdsByEmailLowerBatch(emailsLowerUnique);

    const allGroupIds = new Set<string>();
    for (const em of emailsLowerUnique) {
      for (const gid of groupIdsByEmailLower.get(em) ?? []) {
        allGroupIds.add(gid);
      }
    }

    const groupMetaById = new Map<string, { id: string; email: string; name: string | null }>();
    if (allGroupIds.size > 0) {
      const metaRows = await db
        .select({
          id: workspaceGroup.id,
          email: workspaceGroup.email,
          name: workspaceGroup.name,
        })
        .from(workspaceGroup)
        .where(inArray(workspaceGroup.id, [...allGroupIds]));
      for (const g of metaRows) {
        groupMetaById.set(g.id, g);
      }
    }

    const permByGroupId = new Map<string, string[]>();
    if (allGroupIds.size > 0) {
      const gpr = await db
        .select()
        .from(workspaceGroupPermission)
        .where(inArray(workspaceGroupPermission.workspaceGroupId, [...allGroupIds]));
      for (const p of gpr) {
        const list = permByGroupId.get(p.workspaceGroupId) ?? [];
        list.push(p.permission);
        permByGroupId.set(p.workspaceGroupId, list);
      }
    }

    return c.json({
      users: userRows.map((row) => {
        const emailLower = (row.email ?? "").trim().toLowerCase();
        const gids = groupIdsByEmailLower.get(emailLower) ?? [];
        const workspaceGroups = [...gids]
          .map((id) => {
            const g = groupMetaById.get(id);
            return g ? { id: g.id, email: g.email, name: g.name } : { id, email: id, name: null };
          })
          .sort((a, b) => a.email.localeCompare(b.email));

        const groupPermRaw: string[] = [];
        for (const gid of gids) {
          const plist = permByGroupId.get(gid);
          if (plist) groupPermRaw.push(...plist);
        }
        const groupPermissions = normalizeStoredPermissions(groupPermRaw);

        const effectivePermissions = isSuperAdminUserId(row.id)
          ? allPermissions()
          : groupPermissions;

        return {
          id: row.id,
          name: row.name,
          email: row.email,
          workspaceGroups,
          groupPermissions,
          effectivePermissions,
          isSuperAdmin: isSuperAdminUserId(row.id),
        };
      }),
    });
  });

  app.route("/api/app/ubac", r);
}
