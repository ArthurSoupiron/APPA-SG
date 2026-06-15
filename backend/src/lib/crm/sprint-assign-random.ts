import { and, eq } from "drizzle-orm";

import { db } from "../../db";
import { sprintMember, sprintProspect } from "../../db/schema";

export type SprintAssignRandomResult =
  | { ok: true; updated: number; scope: string }
  | { ok: false; error: "no_members" };

/**
 * Répartition aléatoire des prospects du sprint parmi les membres du sprint.
 * Ne vérifie pas les permissions — à faire dans la route.
 */
export async function assignRandomSprintProspects(
  sprintId: string,
  scope: "unassigned" | "all",
): Promise<SprintAssignRandomResult> {
  const memberRows = await db
    .select({ userId: sprintMember.userId })
    .from(sprintMember)
    .where(eq(sprintMember.sprintId, sprintId));
  const memberIds = memberRows.map((m) => m.userId);
  if (memberIds.length === 0) return { ok: false, error: "no_members" };

  const links = await db.select().from(sprintProspect).where(eq(sprintProspect.sprintId, sprintId));
  const toUpdate = scope === "all" ? links : links.filter((l) => l.assignedUserId == null);
  if (toUpdate.length === 0) return { ok: true, updated: 0, scope };

  await db.transaction(async (tx) => {
    for (const row of toUpdate) {
      const pick = memberIds[Math.floor(Math.random() * memberIds.length)]!;
      await tx
        .update(sprintProspect)
        .set({ assignedUserId: pick })
        .where(
          and(eq(sprintProspect.sprintId, sprintId), eq(sprintProspect.prospectId, row.prospectId)),
        );
    }
  });

  return { ok: true, updated: toUpdate.length, scope };
}
