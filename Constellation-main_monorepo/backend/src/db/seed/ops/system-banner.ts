import type { InferInsertModel } from "drizzle-orm";

import { systemBanner } from "../../schema/ops/system-banner";
import type { SeedDb } from "../db-type";

export type SystemBannerSeedRow = InferInsertModel<typeof systemBanner>;

/** Bandeaux globaux (`ops.system_banner`) — texte factice, sans données réelles. */
export const SYSTEM_BANNER_SEED_ROWS: SystemBannerSeedRow[] = [
  {
    id: "seed-banner-dev-en-cours",
    title: "Développement en cours",
    body: "Développement toujours en cours — merci de ne sauvegarder aucune information importante, sinon je viens vous attraper et je vous boude.",
    severity: "info",
    isActive: true,
    createdBy: null,
  },
];

export async function seedOpsSystemBanners(db: SeedDb): Promise<void> {
  if (SYSTEM_BANNER_SEED_ROWS.length === 0) return;
  await db
    .insert(systemBanner)
    .values(SYSTEM_BANNER_SEED_ROWS)
    .onConflictDoNothing({ target: systemBanner.id });
}
