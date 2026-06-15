import type { Permission } from "../../ubac";
import type { TemplateDocType } from "../../types/missions-api";
import { TEMPLATE_DOCS } from "../../types/missions-api";

/** Permissions catalogue ERP — gestionnaire de missions Jaeger. */
export const ERP_BASE_PERMISSIONS = ["erp.read", "erp.delete"] as const satisfies readonly Permission[];

export const ERP_STRUCTURE_PERMISSIONS = [
  "erp.mission.manage",
  "erp.integration.manage",
] as const satisfies readonly Permission[];

export const ERP_CONFIG_PERMISSIONS = [
  "erp.slack.manage",
  "erp.config.read",
  "erp.templates.sync",
] as const satisfies readonly Permission[];

const DOC_TYPE_SLUG: Record<TemplateDocType, string> = {
  CCA: "cca",
  BC: "bc",
  BCR: "bcr",
  RMI: "rmi",
  ARMI: "armi",
  PVRF: "pvrf",
};

export function erpDocGeneratePermission(docType: TemplateDocType): Permission {
  return `erp.doc.generate.${DOC_TYPE_SLUG[docType]}` as Permission;
}

export function erpDocValidatePermission(docType: TemplateDocType): Permission {
  return `erp.doc.validate.${DOC_TYPE_SLUG[docType]}` as Permission;
}

export const ERP_DOC_GENERATE_PERMISSIONS: Permission[] = TEMPLATE_DOCS.map(erpDocGeneratePermission);
export const ERP_DOC_VALIDATE_PERMISSIONS: Permission[] = TEMPLATE_DOCS.map(erpDocValidatePermission);

export const ERP_MODULE_PERMISSIONS: Permission[] = [
  ...ERP_BASE_PERMISSIONS,
  ...ERP_STRUCTURE_PERMISSIONS,
  ...ERP_CONFIG_PERMISSIONS,
  ...ERP_DOC_GENERATE_PERMISSIONS,
  ...ERP_DOC_VALIDATE_PERMISSIONS,
];
