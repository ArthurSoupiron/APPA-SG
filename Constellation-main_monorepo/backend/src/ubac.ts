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
  "agenda.crm.write",
  "agenda.crm.manage",
  "agenda.crm.delete",
  "agenda.marketing.write",
  "agenda.marketing.manage",
  "agenda.marketing.delete",
  "agenda.rh.write",
  "agenda.rh.manage",
  "agenda.rh.delete",
  "agenda.tresorerie.write",
  "agenda.tresorerie.manage",
  "agenda.tresorerie.delete",
  "agenda.si.write",
  "agenda.si.manage",
  "agenda.si.delete",
  "agenda.operations.write",
  "agenda.operations.manage",
  "agenda.operations.delete",
  "agenda.presidence.write",
  "agenda.presidence.manage",
  "agenda.presidence.delete",
  "agenda.erp.write",
  "agenda.erp.manage",
  "agenda.erp.delete",
  "agenda.academy.write",
  "agenda.academy.manage",
  "agenda.academy.delete",
  "agenda.rfp.write",
  "agenda.rfp.manage",
  "agenda.rfp.delete",

  "erp.read",
  "erp.write",
  "erp.delete",

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

  "presidence.read",
  "presidence.write",
  "presidence.delete",

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
