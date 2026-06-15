import type { Context } from "hono";

import type { AppVariables } from "../../types/app";
import type { Permission } from "../../ubac";
import type { TemplateDocType } from "../../types/missions-api";
import {
  canGenerateDoc,
  canManageBcStructure,
  canManageSlackGroups,
  canReadMissions,
  canSyncTemplates,
  canUseIntegrations,
  canValidateDoc,
  resolveGestionnaireMissionsPermissions,
} from "../../lib/missions/mission-permissions";
import {
  erpDocGeneratePermission,
  erpDocValidatePermission,
} from "../../lib/missions/erp-permission-catalog";

export function requireUser(c: Context<{ Variables: AppVariables }>) {
  const u = c.get("user");
  if (!u) return c.json({ error: "unauthorized" }, 401);
  return null;
}

export function requirePermission(
  c: Context<{ Variables: AppVariables }>,
  check: (perms: readonly Permission[], userId: string) => boolean,
  need: string,
) {
  const u = c.get("user");
  const perms = c.get("sessionPermissions") ?? [];
  if (!u || !check(perms, u.id)) {
    return c.json({ error: "forbidden", need }, 403);
  }
  return null;
}

export function requireMissionsRead(c: Context<{ Variables: AppVariables }>) {
  return requirePermission(c, canReadMissions, "erp.read");
}

export function requireBcStructure(c: Context<{ Variables: AppVariables }>) {
  return requirePermission(c, canManageBcStructure, "erp.mission.manage");
}

export function requireIntegrations(c: Context<{ Variables: AppVariables }>) {
  return requirePermission(c, canUseIntegrations, "erp.integration.manage");
}

export function requireSlackConfig(c: Context<{ Variables: AppVariables }>) {
  return requirePermission(c, canManageSlackGroups, "erp.slack.manage");
}

export function requireTemplateSync(c: Context<{ Variables: AppVariables }>) {
  return requirePermission(c, canSyncTemplates, "erp.templates.sync");
}

export function getMissionPermissions(c: Context<{ Variables: AppVariables }>) {
  const u = c.get("user")!;
  const perms = c.get("sessionPermissions") ?? [];
  return resolveGestionnaireMissionsPermissions(u.id, perms);
}

export function mutationErrorResponse(c: Context<{ Variables: AppVariables }>, err: unknown) {
  if (err && typeof err === "object" && "code" in err) {
    const e = err as { message: string; code: string };
    if (e.code === "not_found") return c.json({ error: e.message }, 404);
    if (e.code === "forbidden") return c.json({ error: e.message }, 403);
  }
  const message = err instanceof Error ? err.message : "Erreur de validation.";
  return c.json({ error: message }, 422);
}

export function requireTemplateGenerate(
  c: Context<{ Variables: AppVariables }>,
  docType: TemplateDocType,
) {
  const u = c.get("user");
  const perms = c.get("sessionPermissions") ?? [];
  if (!u || !canGenerateDoc(perms, u.id, docType)) {
    return c.json({ error: "forbidden", need: erpDocGeneratePermission(docType) }, 403);
  }
  return null;
}

export function requireTemplateValidate(
  c: Context<{ Variables: AppVariables }>,
  docType: TemplateDocType,
) {
  const u = c.get("user");
  const perms = c.get("sessionPermissions") ?? [];
  if (!u || !canValidateDoc(perms, u.id, docType)) {
    return c.json({ error: "forbidden", need: erpDocValidatePermission(docType) }, 403);
  }
  return null;
}
