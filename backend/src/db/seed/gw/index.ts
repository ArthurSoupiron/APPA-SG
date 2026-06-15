import type { SeedDb } from "../db-type";
import { seedGwActionPlanGroupPermissions } from "./action-plan-group-permissions";
import { seedGwCrmGroupPermissions } from "./crm-group-permissions";
import { seedGwErpGroupPermissions } from "./erp-group-permissions";
import { seedGwSiRegistresGroupPermissions } from "./si-registres-group-permissions";

export async function seedGwSchema(db: SeedDb): Promise<void> {
  await seedGwCrmGroupPermissions(db);
  await seedGwErpGroupPermissions(db);
  await seedGwActionPlanGroupPermissions(db);
  await seedGwSiRegistresGroupPermissions(db);
}
