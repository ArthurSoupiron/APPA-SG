import type { InferInsertModel } from "drizzle-orm";

import { verification } from "../../schema/auth/verification";
import type { SeedDb } from "../db-type";

export type VerificationSeedRow = InferInsertModel<typeof verification>;

/** Jetons de vérification (email, etc.). */
export const VERIFICATION_SEED_ROWS: VerificationSeedRow[] = [
  // {
  //   id: "…",
  //   identifier: "…",
  //   value: "…",
  //   expiresAt: new Date(),
  // },
];

export async function seedAuthVerifications(db: SeedDb): Promise<void> {
  if (VERIFICATION_SEED_ROWS.length === 0) return;
  await db
    .insert(verification)
    .values(VERIFICATION_SEED_ROWS)
    .onConflictDoNothing({ target: verification.id });
}
