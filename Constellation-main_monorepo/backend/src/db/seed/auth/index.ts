import type { SeedDb } from "../db-type";

import { seedAuthAccounts } from "./account";
import { seedAuthSessions } from "./session";
import { seedAuthUsers } from "./user";
import { seedAuthVerifications } from "./verification";

export async function seedAuthSchema(db: SeedDb): Promise<void> {
  await seedAuthUsers(db);
  await seedAuthAccounts(db);
  await seedAuthSessions(db);
  await seedAuthVerifications(db);
}
