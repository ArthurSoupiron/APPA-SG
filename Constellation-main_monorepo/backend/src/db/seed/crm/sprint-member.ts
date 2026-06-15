import type { InferInsertModel } from "drizzle-orm";

import { sprintMember } from "../../schema/crm/sprint-member";
import type { SeedDb } from "../db-type";

export type SprintMemberSeedRow = InferInsertModel<typeof sprintMember>;

/** Membres de sprint — `sprintId` / `userId` doivent exister. */
export const SPRINT_MEMBER_SEED_ROWS: SprintMemberSeedRow[] = [
  // { sprintId: "…", userId: "…" },
];

export async function seedCrmSprintMembers(db: SeedDb): Promise<void> {
  if (SPRINT_MEMBER_SEED_ROWS.length === 0) return;
  await db.insert(sprintMember).values(SPRINT_MEMBER_SEED_ROWS).onConflictDoNothing();
}
