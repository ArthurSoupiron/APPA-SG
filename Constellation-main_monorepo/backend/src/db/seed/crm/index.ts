import type { SeedDb } from "../db-type";
import { seedCrmSprints } from "./crm-sprint";
import { seedCrmProspects } from "./prospect";
import { seedCrmProspectStatusLogs } from "./prospect-status-log";
import { seedCrmSprintMembers } from "./sprint-member";
import { seedCrmSprintProspects } from "./sprint-prospect";

export async function seedCrmSchema(db: SeedDb): Promise<void> {
  await seedCrmProspects(db);
  await seedCrmSprints(db);
  await seedCrmSprintMembers(db);
  await seedCrmSprintProspects(db);
  await seedCrmProspectStatusLogs(db);
}
