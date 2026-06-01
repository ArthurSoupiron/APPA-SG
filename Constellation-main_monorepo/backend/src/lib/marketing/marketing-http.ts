import type { Context } from "hono";

import { can } from "../ubac-http";
import type { AppVariables } from "../../types/app";
import type { Permission } from "../../ubac";

type GuardResponse = Response | undefined;

export function requireUser(c: Context<{ Variables: AppVariables }>): GuardResponse {
  const u = c.get("user");
  if (!u) return c.json({ error: "unauthorized" }, 401);
  return undefined;
}

export function requirePermission(
  c: Context<{ Variables: AppVariables }>,
  permission: Permission,
): GuardResponse {
  if (!can(c, permission)) {
    return c.json({ error: "forbidden", need: permission }, 403);
  }
  return undefined;
}

export function guardMarketing(
  c: Context<{ Variables: AppVariables }>,
  permission: Permission,
): GuardResponse {
  const denyUser = requireUser(c);
  if (denyUser) return denyUser;
  return requirePermission(c, permission);
}

export function hashIp(ip: string | undefined): string | null {
  if (!ip?.trim()) return null;
  return Bun.hash(ip.trim()).toString(16);
}

export function newToken(): string {
  return Bun.randomUUIDv7().replace(/-/g, "");
}
