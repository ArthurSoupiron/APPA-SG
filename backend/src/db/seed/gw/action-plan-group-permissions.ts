import { eq } from "drizzle-orm";

import type { Permission } from "../../../ubac";
import { workspaceGroup, workspaceGroupPermission } from "../../schema";
import type { SeedDb } from "../db-type";

/** Toutes les permissions catalogue liées au plan d'action. */
export const ACTION_PLAN_MODULE_PERMISSIONS: Permission[] = [
  "action_plan.read",
  "action_plan.write",
  "action_plan.delete",
  "action_plan.manage",
];

type GroupPermissionSeed = {
  /** Email du groupe Google Workspace (`gw.workspace_group.email`). */
  groupEmail: string;
  permissions: readonly Permission[];
};

const ACTION_PLAN_GROUP_PERMISSION_SEEDS: GroupPermissionSeed[] = [
  {
    groupEmail: "presidence1@jeece.fr",
    permissions: ACTION_PLAN_MODULE_PERMISSIONS,
  },
];

/**
 * Attache les permissions plan d'action aux groupes Workspace déjà synchronisés.
 * Prérequis : sync annuaire Google (`gw.workspace_group` peuplé).
 */
export async function seedGwActionPlanGroupPermissions(db: SeedDb): Promise<void> {
  for (const { groupEmail, permissions } of ACTION_PLAN_GROUP_PERMISSION_SEEDS) {
    const email = groupEmail.trim().toLowerCase();
    const [group] = await db
      .select({ id: workspaceGroup.id })
      .from(workspaceGroup)
      .where(eq(workspaceGroup.email, email))
      .limit(1);

    if (!group) {
      console.warn(
        `[seed] gw: groupe "${email}" introuvable — permissions plan d'action non appliquées (lancer la sync Google Workspace).`,
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
