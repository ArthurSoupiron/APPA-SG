import type { Hono as HonoType } from "hono";
import { Hono } from "hono";

import { syncSlackUserGroupsToDb } from "../../lib/slack/sync-user-groups";
import type { AppVariables } from "../../types/app";
import { denyUnlessSuperAdmin } from "./ubac-admin";

/** Super-admin : synchronisation cache user groups Slack. */
export function registerSlackOpsRoutes(
  app: HonoType<{ Variables: AppVariables }>,
) {
  const r = new Hono<{ Variables: AppVariables }>();

  r.post("/slack/user-groups/sync", async (c) => {
    const denied = denyUnlessSuperAdmin(c);
    if (denied) return denied;
    const result = await syncSlackUserGroupsToDb();
    if (!result.success) {
      return c.json({ error: result.error ?? "sync_failed" }, 422);
    }
    return c.json({ synced: result.synced });
  });

  app.route("/api/app/admin", r);
}
