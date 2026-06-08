import type { SeedDb } from "../db-type";

import { seedSiGoogleDriveItems } from "./google-drive-item";

export async function seedSiSchema(db: SeedDb): Promise<void> {
  await seedSiGoogleDriveItems(db);
}
