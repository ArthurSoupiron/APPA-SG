import type { SeedDb } from "../db-type";

import { seedOpsSystemBanners } from "./system-banner";

export async function seedOpsSchema(db: SeedDb): Promise<void> {
  await seedOpsSystemBanners(db);
}
