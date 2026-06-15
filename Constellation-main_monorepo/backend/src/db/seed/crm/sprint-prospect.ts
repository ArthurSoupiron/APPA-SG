import type { InferInsertModel } from "drizzle-orm";

import { sprintProspect } from "../../schema/crm/sprint-prospect";
import type { SeedDb } from "../db-type";

export type SprintProspectSeedRow = InferInsertModel<typeof sprintProspect>;

/** Liaison sprint ↔ prospect — IDs doivent exister. */
export const SPRINT_PROSPECT_SEED_ROWS: SprintProspectSeedRow[] = [
  // { sprintId: "…", prospectId: "…" },
];

export async function seedCrmSprintProspects(db: SeedDb): Promise<void> {
  if (SPRINT_PROSPECT_SEED_ROWS.length === 0) return;
  await db.insert(sprintProspect).values(SPRINT_PROSPECT_SEED_ROWS).onConflictDoNothing();
}
