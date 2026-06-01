import type { Context } from "hono";
import type { AppVariables } from "../types/app";
import type { Permission } from "../ubac";

/** Après `sessionMiddleware`, les droits effectifs (super-admin = tout). */
export function can(c: Context<{ Variables: AppVariables }>, permission: Permission): boolean {
  const perms = c.get("sessionPermissions");
  return perms?.includes(permission) ?? false;
}
