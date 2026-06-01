import type { SeedDb } from "../db-type";
import { seedGwCrmGroupPermissions } from "./crm-group-permissions";

export async function seedGwSchema(db: SeedDb): Promise<void> {
  await seedGwCrmGroupPermissions(db);
}
