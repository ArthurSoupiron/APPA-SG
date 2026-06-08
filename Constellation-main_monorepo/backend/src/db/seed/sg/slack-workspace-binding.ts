import type { InferInsertModel } from "drizzle-orm";

import { slackWorkspaceBinding } from "../../schema/sg/slack-workspace-binding";
import type { SeedDb } from "../db-type";

export type SlackWorkspaceBindingSeedRow = InferInsertModel<typeof slackWorkspaceBinding>;

/** Workspaces Slack installés — `installedByUserId` optionnel (`auth.user`). */
export const SLACK_WORKSPACE_BINDING_SEED_ROWS: SlackWorkspaceBindingSeedRow[] = [
  // {
  //   id: "…",
  //   teamId: "T…",
  // },
];

export async function seedSgSlackWorkspaceBindings(db: SeedDb): Promise<void> {
  if (SLACK_WORKSPACE_BINDING_SEED_ROWS.length === 0) return;
  await db
    .insert(slackWorkspaceBinding)
    .values(SLACK_WORKSPACE_BINDING_SEED_ROWS)
    .onConflictDoNothing({ target: slackWorkspaceBinding.teamId });
}
