import { WebClient } from "@slack/web-api";
import { inArray } from "drizzle-orm";

import { db } from "../../db";
import { slackUserGroup } from "../../db/schema";

export type SlackUserGroupRow = {
  id: string;
  name: string;
  handle: string;
  description: string;
  userCount: number;
  isDisabled: boolean;
};

function getSlackToken(): string | undefined {
  return (
    process.env.SLACK_USER_BOT_TOKEN?.trim() || process.env.SLACK_BOT_TOKEN?.trim()
  );
}

async function fetchSlackUserGroupsFromApi(
  includeDisabled = true,
): Promise<{ success: boolean; groups: SlackUserGroupRow[]; error?: string }> {
  const token = getSlackToken();
  if (!token) {
    return { success: false, groups: [], error: "Token Slack non configuré." };
  }
  const client = new WebClient(token);
  try {
    const data = (await client.usergroups.list({
      include_disabled: includeDisabled,
    })) as {
      ok: boolean;
      error?: string;
      usergroups?: Array<{
        id: string;
        name: string;
        handle?: string;
        description?: string;
        user_count?: number;
        date_delete?: number;
      }>;
    };
    if (!data.ok) {
      return {
        success: false,
        groups: [],
        error: data.error ?? "Erreur API Slack usergroups.list",
      };
    }
    const groups: SlackUserGroupRow[] = (data.usergroups ?? []).map((g) => ({
      id: g.id,
      name: g.name,
      handle: g.handle ?? "",
      description: g.description ?? "",
      userCount: g.user_count ?? 0,
      isDisabled: (g.date_delete ?? 0) > 0,
    }));
    return { success: true, groups };
  } catch (e) {
    return {
      success: false,
      groups: [],
      error: e instanceof Error ? e.message : "Erreur inconnue",
    };
  }
}

/** Synchronise les user groups Slack vers `sg.slack_user_groups`. */
export async function syncSlackUserGroupsToDb(): Promise<{
  success: boolean;
  synced: number;
  error?: string;
}> {
  const apiResult = await fetchSlackUserGroupsFromApi(true);
  if (!apiResult.success) {
    return { success: false, synced: 0, error: apiResult.error };
  }
  const groups = apiResult.groups;
  const now = new Date();
  try {
    const existing = await db.select({ id: slackUserGroup.id }).from(slackUserGroup);
    const apiIds = new Set(groups.map((g) => g.id));
    const toDelete = existing.map((r) => r.id).filter((id) => !apiIds.has(id));
    if (toDelete.length > 0) {
      await db.delete(slackUserGroup).where(inArray(slackUserGroup.id, toDelete));
    }
    for (const g of groups) {
      await db
        .insert(slackUserGroup)
        .values({
          id: g.id,
          name: g.name,
          handle: g.handle,
          description: g.description,
          userCount: g.userCount,
          isDisabled: g.isDisabled,
          lastRefreshedAt: now,
        })
        .onConflictDoUpdate({
          target: slackUserGroup.id,
          set: {
            name: g.name,
            handle: g.handle,
            description: g.description,
            userCount: g.userCount,
            isDisabled: g.isDisabled,
            lastRefreshedAt: now,
            updatedAt: now,
          },
        });
    }
    return { success: true, synced: groups.length };
  } catch (e) {
    return {
      success: false,
      synced: 0,
      error: e instanceof Error ? e.message : "Erreur mise à jour cache BDD",
    };
  }
}
