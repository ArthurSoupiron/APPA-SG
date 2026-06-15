import { eq } from "drizzle-orm";

import type { Permission } from "../../../ubac";
import { workspaceGroup, workspaceGroupPermission } from "../../schema";
import type { SeedDb } from "../db-type";
import {
  ERP_CONFIG_PERMISSIONS,
  ERP_DOC_GENERATE_PERMISSIONS,
  ERP_DOC_VALIDATE_PERMISSIONS,
  ERP_MODULE_PERMISSIONS,
  ERP_STRUCTURE_PERMISSIONS,
} from "../../../lib/missions/erp-permission-catalog";

/** Agenda — pôle operations (jalons mission). */
export const ERP_AGENDA_POLE_PERMISSIONS: Permission[] = [
  "agenda.read",
  "operations.agenda.write",
  "operations.agenda.manage",
  "operations.agenda.delete",
];

type GroupPermissionSeed = {
  groupEmail: string;
  permissions: readonly Permission[];
};

/** Droits opérationnels commercial / CDP (sans admin config ERP). */
const ERP_OPERATOR_PERMISSIONS: Permission[] = [
  "erp.read",
  ...ERP_STRUCTURE_PERMISSIONS,
  ...ERP_DOC_GENERATE_PERMISSIONS,
  ...ERP_DOC_VALIDATE_PERMISSIONS,
];

/**
 * Permissions ERP par groupe Google Workspace.
 * Ne pas utiliser administrateurs@jeece.fr — réservé à l'administration globale, pas au module ERP.
 */
const ERP_GROUP_PERMISSION_SEEDS: GroupPermissionSeed[] = [
  {
    groupEmail: "commercial1@jeece.fr",
    permissions: [...ERP_OPERATOR_PERMISSIONS, ...ERP_AGENDA_POLE_PERMISSIONS],
  },
  {
    groupEmail: "directeur-commercial@jeece.fr",
    permissions: ERP_MODULE_PERMISSIONS,
  },
  {
    groupEmail: "cdp@jeece.fr",
    permissions: ERP_OPERATOR_PERMISSIONS,
  },
];

export async function seedGwErpGroupPermissions(db: SeedDb): Promise<void> {
  for (const { groupEmail, permissions } of ERP_GROUP_PERMISSION_SEEDS) {
    const email = groupEmail.trim().toLowerCase();
    const [group] = await db
      .select({ id: workspaceGroup.id })
      .from(workspaceGroup)
      .where(eq(workspaceGroup.email, email))
      .limit(1);

    if (!group) {
      console.warn(
        `[seed] gw: groupe "${email}" introuvable — permissions ERP non appliquées (lancer la sync Google Workspace).`,
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
