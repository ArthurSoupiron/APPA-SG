import type { SeedDb } from "../db-type";

import { seedSgSlackUserBindings } from "./slack-user-binding";
import { seedSgSlackWorkspaceBindings } from "./slack-workspace-binding";

export async function seedSgSchema(db: SeedDb): Promise<void> {
  await seedSgSlackWorkspaceBindings(db);
  await seedSgSlackUserBindings(db);
}
