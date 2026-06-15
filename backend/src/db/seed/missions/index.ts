import type { SeedDb } from "../db-type";
import { seedMissionSlackGroupConfig } from "./slack-group-config";

export async function seedMissionsSchema(db: SeedDb): Promise<void> {
  await seedMissionSlackGroupConfig(db);
}
