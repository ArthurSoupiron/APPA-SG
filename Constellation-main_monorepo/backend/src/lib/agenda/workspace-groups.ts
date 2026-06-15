import { asc, eq } from "drizzle-orm";

import { db } from "../../db";
import { workspaceGroup, workspaceGroupPermission } from "../../db/schema";

export type AgendaWorkspaceGroupOption = {
  id: string;
  email: string;
  name: string | null;
};

/** Groupes GW ayant au moins une permission UBAC (utilisés pour le RBAC). */
export async function listUbacWorkspaceGroups(): Promise<AgendaWorkspaceGroupOption[]> {
  const rows = await db
    .selectDistinct({
      id: workspaceGroup.id,
      email: workspaceGroup.email,
      name: workspaceGroup.name,
    })
    .from(workspaceGroup)
    .innerJoin(
      workspaceGroupPermission,
      eq(workspaceGroupPermission.workspaceGroupId, workspaceGroup.id),
    )
    .orderBy(asc(workspaceGroup.email));

  return rows;
}

export async function validateUbacWorkspaceGroupIds(ids: string[]): Promise<boolean> {
  if (ids.length === 0) return false;
  const allowed = await listUbacWorkspaceGroups();
  const allowedSet = new Set(allowed.map((g) => g.id));
  return ids.every((id) => allowedSet.has(id));
}
