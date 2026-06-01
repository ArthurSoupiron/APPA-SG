import { inArray } from "drizzle-orm";
import type { MiddlewareHandler } from "hono";

import { auth } from "../auth";
import { db } from "../db";
import { workspaceGroupPermission } from "../db/schema";
import { getWorkspaceGroupIdsForUserEmail } from "../lib/gw-group-membership";
import type { AppVariables } from "../types/app";
import { isSuperAdminUserId, normalizeStoredPermissions, permissionsForUser } from "../ubac";

export const sessionMiddleware: MiddlewareHandler<{
  Variables: AppVariables;
}> = async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    c.set("user", null);
    c.set("session", null);
    c.set("sessionPermissions", null);
    await next();
    return;
  }
  c.set("user", session.user);
  c.set("session", session.session);

  if (!isSuperAdminUserId(session.user.id)) {
    const groupIds = await getWorkspaceGroupIdsForUserEmail(session.user.email ?? "");
    let groupPermissionStrings: string[] = [];
    if (groupIds.length > 0) {
      const gp = await db
        .select({ permission: workspaceGroupPermission.permission })
        .from(workspaceGroupPermission)
        .where(inArray(workspaceGroupPermission.workspaceGroupId, groupIds));
      groupPermissionStrings = gp.map((r) => r.permission);
    }

    const effectivePerms = normalizeStoredPermissions(groupPermissionStrings);
    c.set("sessionPermissions", permissionsForUser(session.user.id, effectivePerms));
  } else {
    c.set("sessionPermissions", permissionsForUser(session.user.id, []));
  }

  const logAccess =
    process.env.HTTP_ACCESS_LOG === "1" ||
    process.env.HTTP_ACCESS_LOG === "true" ||
    process.env.NODE_ENV !== "production";
  if (logAccess && !c.req.path.startsWith("/api/auth")) {
    const ts = new Date().toISOString();
    console.log(`[${ts}] [hono] ${c.req.method} ${c.req.path} (user: ${session.user.id})`);
  }
  await next();
};
