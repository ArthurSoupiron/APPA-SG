import type { InferInsertModel } from "drizzle-orm";

import { prospect } from "../../schema/crm/prospect";
import type { SeedDb } from "../db-type";

export type ProspectSeedRow = InferInsertModel<typeof prospect>;

/** Prospects CRM — `createdBy` optionnel, doit référencer `auth.user` si renseigné. */
export const PROSPECT_SEED_ROWS: ProspectSeedRow[] = [
  // {
  //   id: "…",
  //   nom: "…",
  //   statut: "a_contacter",
  // },
];

export async function seedCrmProspects(db: SeedDb): Promise<void> {
  if (PROSPECT_SEED_ROWS.length === 0) return;
  await db.insert(prospect).values(PROSPECT_SEED_ROWS).onConflictDoNothing({ target: prospect.id });
}
