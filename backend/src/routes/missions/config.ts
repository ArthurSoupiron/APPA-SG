import { asc } from "drizzle-orm";
import type { Hono } from "hono";

import { db } from "../../db";
import { slackUserGroup } from "../../db/schema";
import {
  listMissionSlackGroupConfigIds,
  replaceMissionSlackGroupConfigIds,
} from "../../lib/missions/repositories/slack-group-config";
import type { SlackGroupOption } from "../../types/missions-api";
import type { AppVariables } from "../../types/app";
import { requireMissionsRead, requireSlackConfig, requireUser } from "./helpers";

export function registerMissionsConfigRoutes(app: Hono<{ Variables: AppVariables }>) {
  app.get("/missions/config/slack-groups", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const perm = requireMissionsRead(c);
    if (perm) return perm;

    const [groups, selectedIds] = await Promise.all([
      db
        .select({
          id: slackUserGroup.id,
          name: slackUserGroup.name,
          handle: slackUserGroup.handle,
          isDisabled: slackUserGroup.isDisabled,
        })
        .from(slackUserGroup)
        .orderBy(asc(slackUserGroup.name)),
      listMissionSlackGroupConfigIds(),
    ]);
    const selectedSet = new Set(selectedIds);
    const options: SlackGroupOption[] = groups.map((group) => ({
      id: group.id,
      name: group.name,
      handle: group.handle || group.name,
      isDisabled: group.isDisabled,
      selected: selectedSet.has(group.id),
    }));
    return c.json(options);
  });

  app.put("/missions/config/slack-groups", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const permWrite = requireSlackConfig(c);
    if (permWrite) return permWrite;
    const body = (await c.req.json()) as { groupIds?: string[] };
    const groupIds = Array.isArray(body.groupIds) ? body.groupIds : [];
    await replaceMissionSlackGroupConfigIds(groupIds);
    return c.body(null, 204);
  });
}
