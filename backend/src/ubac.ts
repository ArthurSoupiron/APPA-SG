/**
 * Catalogue unique des permissions applicatives.
 * Droits effectifs : `gw.workspace_group_permission` pour chaque groupe Google dont l’utilisateur est membre.
 * Super-admin : `ADMIN_USER_IDS` → toutes les permissions.
 */

export const PERMISSIONS = [
  "app.overview",
  "app.concours",
  // Nav account (sidebar) — Jaeger, etc.
  "app.operations",

  "agenda.read",
  "crm.agenda.write",
  "crm.agenda.manage",
  "crm.agenda.delete",
  "marketing.agenda.write",
  "marketing.agenda.manage",
  "marketing.agenda.delete",
  "rh.agenda.write",
  "rh.agenda.manage",
  "rh.agenda.delete",
  "tresorerie.agenda.write",
  "tresorerie.agenda.manage",
  "tresorerie.agenda.delete",
  "si.agenda.write",
  "si.agenda.manage",
  "si.agenda.delete",
  "operations.agenda.write",
  "operations.agenda.manage",
  "operations.agenda.delete",
  "presidence.agenda.write",
  "presidence.agenda.manage",
  "presidence.agenda.delete",
  "erp.agenda.write",
  "erp.agenda.manage",
  "erp.agenda.delete",
  "academy.agenda.write",
  "academy.agenda.manage",
  "academy.agenda.delete",
  "rfp.agenda.write",
  "rfp.agenda.manage",
  "rfp.agenda.delete",

  "erp.read",
  "erp.delete",
  "erp.mission.manage",
  "erp.integration.manage",
  "erp.slack.manage",
  "erp.config.read",
  "erp.templates.sync",
  "erp.doc.generate.cca",
  "erp.doc.generate.bc",
  "erp.doc.generate.bcr",
  "erp.doc.generate.rmi",
  "erp.doc.generate.armi",
  "erp.doc.generate.pvrf",
  "erp.doc.validate.cca",
  "erp.doc.validate.bc",
  "erp.doc.validate.bcr",
  "erp.doc.validate.rmi",
  "erp.doc.validate.armi",
  "erp.doc.validate.pvrf",

  "crm.read",
  "crm.write",
  "crm.delete",
  "crm.sprint.create",
  "crm.sprint.manage",
  "crm.sprint.join",
  "crm.kpi.read",
  "crm.kpi.global",

  "marketing.read",
  "marketing.write",
  "marketing.delete",

  "academy.read",
  "academy.write",
  "academy.delete",

  "rfp.read",
  "rfp.write",
  "rfp.delete",

  "si.read",
  "si.write",
  "si.delete",
  "si.ticket.manage",
  "si.registres.read",
  "si.registres.write",
  "si.registres.delete",

  "presidence.read",
  "presidence.write",
  "presidence.delete",

  "action_plan.read",
  "action_plan.write",
  "action_plan.delete",
  "action_plan.manage",

  "tresorerie.read",
  "tresorerie.write",
  "tresorerie.delete",

  "rh.read",
  "rh.write",
  "rh.delete",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const PERMISSION_SET = new Set<string>(PERMISSIONS);

export function getSuperAdminUserIds(): string[] {
  return (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isSuperAdminUserId(userId: string): boolean {
  return getSuperAdminUserIds().includes(userId);
}

/** Filtre une liste brute (ex. lignes `workspace_group_permission`) vers le catalogue. */
export function normalizeStoredPermissions(raw: unknown): Permission[] {
  if (!Array.isArray(raw)) return [];
  const out = new Set<Permission>();
  for (const x of raw) {
    if (typeof x === "string" && PERMISSION_SET.has(x)) {
      out.add(x as Permission);
    }
  }
  return [...out];
}

export function allPermissions(): Permission[] {
  return [...PERMISSIONS];
}

/**
 * Droits effectifs pour la session : super-admin = tout, sinon permissions groupes (déjà normalisées).
 */
export function permissionsForUser(
  userId: string,
  groupPermissions: readonly Permission[],
): Permission[] {
  if (isSuperAdminUserId(userId)) return allPermissions();
  return [...groupPermissions];
}

export function validatePermissionList(input: unknown): Permission[] | null {
  if (!Array.isArray(input)) return null;
  const out: Permission[] = [];
  for (const x of input) {
    if (typeof x !== "string" || !PERMISSION_SET.has(x)) return null;
    out.push(x as Permission);
  }
  return [...new Set(out)];
}
