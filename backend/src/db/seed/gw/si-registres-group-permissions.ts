import { eq } from "drizzle-orm";

import type { Permission } from "../../../ubac";
import { workspaceGroup, workspaceGroupPermission } from "../../schema";
import type { SeedDb } from "../db-type";

export const SI_REGISTRES_MODULE_PERMISSIONS: Permission[] = [
  "si.registres.read",
  "si.registres.write",
  "si.registres.delete",
];

type GroupPermissionSeed = {
  groupEmail: string;
  permissions: readonly Permission[];
};

const SI_REGISTRES_GROUP_PERMISSION_SEEDS: GroupPermissionSeed[] = [
  {
    groupEmail: "administrateurs@jeece.fr",
    permissions: SI_REGISTRES_MODULE_PERMISSIONS,
  },
  {
    groupEmail: "presidence1@jeece.fr",
    permissions: SI_REGISTRES_MODULE_PERMISSIONS,
  },
];

/**
 * Attache les permissions registres SI aux groupes Workspace déjà synchronisés.
 * Prérequis : sync annuaire Google (`gw.workspace_group` peuplé).
 */
export async function seedGwSiRegistresGroupPermissions(db: SeedDb): Promise<void> {
  for (const { groupEmail, permissions } of SI_REGISTRES_GROUP_PERMISSION_SEEDS) {
    const email = groupEmail.trim().toLowerCase();
    const [group] = await db
      .select({ id: workspaceGroup.id })
      .from(workspaceGroup)
      .where(eq(workspaceGroup.email, email))
      .limit(1);

    if (!group) {
      console.warn(
        `[seed] gw: groupe "${email}" introuvable — permissions registres SI non appliquées (lancer la sync Google Workspace).`,
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
