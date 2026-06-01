import type { InferInsertModel } from "drizzle-orm";

import { prospectStatusLog } from "../../schema/crm/prospect-status-log";
import type { SeedDb } from "../db-type";

export type ProspectStatusLogSeedRow = InferInsertModel<typeof prospectStatusLog>;

/** Historique de statuts — `prospectId` doit exister. */
export const PROSPECT_STATUS_LOG_SEED_ROWS: ProspectStatusLogSeedRow[] = [
  // {
  //   id: "…",
  //   prospectId: "…",
  //   newStatus: "contacte",
  // },
];

export async function seedCrmProspectStatusLogs(db: SeedDb): Promise<void> {
  if (PROSPECT_STATUS_LOG_SEED_ROWS.length === 0) return;
  await db
    .insert(prospectStatusLog)
    .values(PROSPECT_STATUS_LOG_SEED_ROWS)
    .onConflictDoNothing({ target: prospectStatusLog.id });
}
