import type { InferInsertModel } from "drizzle-orm";

import { crmSprint } from "../../schema/crm/crm-sprint";
import type { SeedDb } from "../db-type";

export type CrmSprintSeedRow = InferInsertModel<typeof crmSprint>;

/** Sprints — `createdBy` obligatoire, doit exister dans `auth.user`. */
export const CRM_SPRINT_SEED_ROWS: CrmSprintSeedRow[] = [
  // {
  //   id: "…",
  //   name: "…",
  //   dateStart: new Date(),
  //   dateEnd: new Date(),
  //   createdBy: "…",
  // },
];

export async function seedCrmSprints(db: SeedDb): Promise<void> {
  if (CRM_SPRINT_SEED_ROWS.length === 0) return;
  await db
    .insert(crmSprint)
    .values(CRM_SPRINT_SEED_ROWS)
    .onConflictDoNothing({ target: crmSprint.id });
}
