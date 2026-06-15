import type { Permission } from "../../ubac";
import { isSuperAdminUserId } from "../../ubac";
import type { GestionnaireMissionsPermissions, TemplateDocType } from "../../types/missions-api";
import { TEMPLATE_DOCS } from "../../types/missions-api";
import {
  erpDocGeneratePermission,
  erpDocValidatePermission,
} from "./erp-permission-catalog";

function has(perms: readonly Permission[], key: Permission): boolean {
  return perms.includes(key);
}

function docFlags(
  perms: readonly Permission[],
  admin: boolean,
  kind: "generate" | "validate",
): Record<TemplateDocType, boolean> {
  return Object.fromEntries(
    TEMPLATE_DOCS.map((doc) => {
      const key =
        kind === "generate" ? erpDocGeneratePermission(doc) : erpDocValidatePermission(doc);
      return [doc, admin || has(perms, key)];
    }),
  ) as Record<TemplateDocType, boolean>;
}

/** Droits effectifs ERP (gestionnaire de missions) depuis UBAC. */
export function resolveGestionnaireMissionsPermissions(
  userId: string,
  sessionPermissions: readonly Permission[],
): GestionnaireMissionsPermissions {
  const admin = isSuperAdminUserId(userId);
  const canGenerateByDoc = docFlags(sessionPermissions, admin, "generate");
  const canValidateByDoc = docFlags(sessionPermissions, admin, "validate");
  const canGenerateTemplates =
    admin || TEMPLATE_DOCS.some((doc) => canGenerateByDoc[doc]);
  const canValidateDocuments =
    admin || TEMPLATE_DOCS.some((doc) => canValidateByDoc[doc]);

  return {
    canGenerateTemplates,
    canValidateDocuments,
    canManageBcStructure: admin || has(sessionPermissions, "erp.mission.manage"),
    canManageIntegrations: admin || has(sessionPermissions, "erp.integration.manage"),
    canManageSlackGroups: admin || has(sessionPermissions, "erp.slack.manage"),
    canManagePermissions: admin || has(sessionPermissions, "erp.config.read"),
    canSyncTemplates: admin || has(sessionPermissions, "erp.templates.sync"),
    canUseSlackDebug: admin,
    canGenerateByDoc,
    canValidateByDoc,
  };
}

export function canReadMissions(perms: readonly Permission[], userId: string): boolean {
  return isSuperAdminUserId(userId) || has(perms, "erp.read");
}

export function canManageBcStructure(perms: readonly Permission[], userId: string): boolean {
  return isSuperAdminUserId(userId) || has(perms, "erp.mission.manage");
}

export function canUseIntegrations(perms: readonly Permission[], userId: string): boolean {
  return isSuperAdminUserId(userId) || has(perms, "erp.integration.manage");
}

export function canManageSlackGroups(perms: readonly Permission[], userId: string): boolean {
  return isSuperAdminUserId(userId) || has(perms, "erp.slack.manage");
}

export function canReadErpConfig(perms: readonly Permission[], userId: string): boolean {
  return isSuperAdminUserId(userId) || has(perms, "erp.config.read");
}

export function canSyncTemplates(perms: readonly Permission[], userId: string): boolean {
  return isSuperAdminUserId(userId) || has(perms, "erp.templates.sync");
}

export function canGenerateDoc(
  perms: readonly Permission[],
  userId: string,
  docType: TemplateDocType,
): boolean {
  return (
    isSuperAdminUserId(userId) || has(perms, erpDocGeneratePermission(docType))
  );
}

export function canValidateDoc(
  perms: readonly Permission[],
  userId: string,
  docType: TemplateDocType,
): boolean {
  return (
    isSuperAdminUserId(userId) || has(perms, erpDocValidatePermission(docType))
  );
}

export function canDeleteMissions(perms: readonly Permission[], userId: string): boolean {
  return isSuperAdminUserId(userId) || has(perms, "erp.delete");
}
