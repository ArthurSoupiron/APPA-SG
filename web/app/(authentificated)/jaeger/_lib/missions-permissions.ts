import {
  type GestionnaireMissionsPermissions,
  TEMPLATE_DOCS,
  type TemplateDocType,
} from "./missions-types";

const DOC_GENERATE_PERM: Record<TemplateDocType, string> = {
  CCA: "erp.doc.generate.cca",
  BC: "erp.doc.generate.bc",
  BCR: "erp.doc.generate.bcr",
  RMI: "erp.doc.generate.rmi",
  ARMI: "erp.doc.generate.armi",
  PVRF: "erp.doc.generate.pvrf",
};

const DOC_VALIDATE_PERM: Record<TemplateDocType, string> = {
  CCA: "erp.doc.validate.cca",
  BC: "erp.doc.validate.bc",
  BCR: "erp.doc.validate.bcr",
  RMI: "erp.doc.validate.rmi",
  ARMI: "erp.doc.validate.armi",
  PVRF: "erp.doc.validate.pvrf",
};

function docFlags(
  hasPermission: (p: string) => boolean,
  kind: "generate" | "validate",
): Record<TemplateDocType, boolean> {
  const map = kind === "generate" ? DOC_GENERATE_PERM : DOC_VALIDATE_PERM;
  return TEMPLATE_DOCS.reduce(
    (acc, doc) => {
      acc[doc] = hasPermission(map[doc]);
      return acc;
    },
    {} as Record<TemplateDocType, boolean>,
  );
}

/** Cartographie UBAC ERP → permissions gestionnaire (fallback si GET /permissions/me indisponible). */
export function buildMissionPermissionsFromUbac(
  hasPermission: (p: string) => boolean,
): GestionnaireMissionsPermissions {
  const canGenerateByDoc = docFlags(hasPermission, "generate");
  const canValidateByDoc = docFlags(hasPermission, "validate");

  return {
    canGenerateTemplates: TEMPLATE_DOCS.some((doc) => canGenerateByDoc[doc]),
    canValidateDocuments: TEMPLATE_DOCS.some((doc) => canValidateByDoc[doc]),
    canManageBcStructure: hasPermission("erp.mission.manage"),
    canManageIntegrations: hasPermission("erp.integration.manage"),
    canManageSlackGroups: hasPermission("erp.slack.manage"),
    canManagePermissions: hasPermission("erp.config.read"),
    canSyncTemplates: hasPermission("erp.templates.sync"),
    canUseSlackDebug: false,
    canGenerateByDoc,
    canValidateByDoc,
  };
}

export function mergeMissionPermissions(
  remote: Partial<GestionnaireMissionsPermissions> | null,
  fallback: GestionnaireMissionsPermissions,
): GestionnaireMissionsPermissions {
  if (!remote) return fallback;
  return {
    ...fallback,
    ...remote,
    canGenerateByDoc: { ...fallback.canGenerateByDoc, ...remote.canGenerateByDoc },
    canValidateByDoc: { ...fallback.canValidateByDoc, ...remote.canValidateByDoc },
  };
}
