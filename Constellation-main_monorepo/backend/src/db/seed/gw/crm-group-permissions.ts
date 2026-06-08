import { eq } from "drizzle-orm";

import type { Permission } from "../../../ubac";
import { workspaceGroup, workspaceGroupPermission } from "../../schema";
import type { SeedDb } from "../db-type";

/** Toutes les permissions catalogue liées au module CRM (Myster). */
export const CRM_MODULE_PERMISSIONS: Permission[] = [
  "crm.read",
  "crm.write",
  "crm.delete",
  "crm.sprint.create",
  "crm.sprint.manage",
  "crm.sprint.join",
  "crm.kpi.read",
  "crm.kpi.global",
];

/** Agenda — pôle commercial (événements CRM). */
export const CRM_AGENDA_POLE_PERMISSIONS: Permission[] = [
  "agenda.read",
  "agenda.crm.write",
  "agenda.crm.manage",
  "agenda.crm.delete",
];

type GroupPermissionSeed = {
  /** Email du groupe Google Workspace (`gw.workspace_group.email`). */
  groupEmail: string;
  permissions: readonly Permission[];
};

const CRM_GROUP_PERMISSION_SEEDS: GroupPermissionSeed[] = [
  {
    groupEmail: "commercial1@jeece.fr",
    permissions: [...CRM_MODULE_PERMISSIONS, ...CRM_AGENDA_POLE_PERMISSIONS],
  },
  {
    groupEmail: "directeur-commercial@jeece.fr",
    permissions: CRM_MODULE_PERMISSIONS,
  },
  {
    groupEmail: "cdp@jeece.fr",
    permissions: CRM_MODULE_PERMISSIONS,
  },
];

/**
 * Attache les permissions CRM aux groupes Workspace déjà synchronisés.
 * Prérequis : sync annuaire Google (`gw.workspace_group` peuplé).
 */
export async function seedGwCrmGroupPermissions(db: SeedDb): Promise<void> {
  for (const { groupEmail, permissions } of CRM_GROUP_PERMISSION_SEEDS) {
    const email = groupEmail.trim().toLowerCase();
    const [group] = await db
      .select({ id: workspaceGroup.id })
      .from(workspaceGroup)
      .where(eq(workspaceGroup.email, email))
      .limit(1);

    if (!group) {
      console.warn(
        `[seed] gw: groupe "${email}" introuvable — permissions CRM non appliquées (lancer la sync Google Workspace).`,
      );
      continue;
    }

    for (const permission of permissions) {
      await db
        .insert(workspaceGroupPermission)
        .values({ workspaceGroupId: group.id, permission })
        .onConflictDoNothing();
    }
  }
}
