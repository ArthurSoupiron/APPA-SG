import { eq } from "drizzle-orm";

import { missionSlackGroupConfig, slackUserGroup } from "../../schema";
import { syncSlackUserGroupsToDb } from "../../../lib/slack/sync-user-groups";
import type { SeedDb } from "../db-type";

/** User groups Slack invités par défaut aux canaux mission (@ao, @groupe_nda). */
const DEFAULT_SLACK_GROUP_HANDLES = ["ao", "groupe_nda"];

export async function seedMissionSlackGroupConfig(db: SeedDb): Promise<void> {
  const token =
    process.env.SLACK_USER_BOT_TOKEN?.trim() || process.env.SLACK_BOT_TOKEN?.trim();
  if (token) {
    const sync = await syncSlackUserGroupsToDb();
    if (!sync.success) {
      console.warn(`[seed] missions: sync Slack user groups échouée — ${sync.error}`);
    }
  }

  for (const handle of DEFAULT_SLACK_GROUP_HANDLES) {
    const normalized = handle.trim().toLowerCase();
    const [group] = await db
      .select({ id: slackUserGroup.id })
      .from(slackUserGroup)
      .where(eq(slackUserGroup.handle, normalized))
      .limit(1);

    if (!group) {
      console.warn(
        `[seed] missions: user group Slack "@${normalized}" introuvable — lancez POST /api/app/admin/slack/user-groups/sync.`,
      );
      continue;
    }

    await db
      .insert(missionSlackGroupConfig)
      .values({ groupId: group.id })
      .onConflictDoNothing();
  }
}
