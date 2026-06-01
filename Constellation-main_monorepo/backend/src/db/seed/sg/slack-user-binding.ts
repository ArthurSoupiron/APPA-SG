import type { InferInsertModel } from "drizzle-orm";

import { slackUserBinding } from "../../schema/sg/slack-user-binding";
import type { SeedDb } from "../db-type";

export type SlackUserBindingSeedRow = InferInsertModel<typeof slackUserBinding>;

/** Comptes Slack liés — `userId` doit exister dans `auth.user`. */
export const SLACK_USER_BINDING_SEED_ROWS: SlackUserBindingSeedRow[] = [
  // {
  //   id: "…",
  //   userId: "…",
  //   slackUserId: "U…",
  //   slackTeamId: "T…",
  // },
];

export async function seedSgSlackUserBindings(db: SeedDb): Promise<void> {
  if (SLACK_USER_BINDING_SEED_ROWS.length === 0) return;
  await db
    .insert(slackUserBinding)
    .values(SLACK_USER_BINDING_SEED_ROWS)
    .onConflictDoNothing({
      target: [slackUserBinding.userId, slackUserBinding.slackTeamId],
    });
}
