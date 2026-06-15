import type { Hono } from "hono";

import {
  createMissionSlackChannel,
  debugSendMissionSlackGroupTagMessage,
  debugSendMissionSlackMessage,
  ensureMissionDriveLink,
  getMissionIntegrationState,
  linkMissionSlackChannel,
} from "../../lib/missions/integrations-service";
import type { AppVariables } from "../../types/app";
import {
  getMissionPermissions,
  requireIntegrations,
  requireMissionsRead,
  requireUser,
} from "./helpers";

export function registerMissionsIntegrationRoutes(app: Hono<{ Variables: AppVariables }>) {
  app.get("/missions/:missionId/integrations", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const perm = requireMissionsRead(c);
    if (perm) return perm;
    const user = c.get("user")!;
    const state = await getMissionIntegrationState(user.id, c.req.param("missionId"));
    if (!state) return c.json({ error: "not_found" }, 404);
    return c.json(state);
  });

  app.post("/missions/:missionId/integrations/drive", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const perm = requireIntegrations(c);
    if (perm) return perm;
    const user = c.get("user")!;
    try {
      const folder = await ensureMissionDriveLink(user.id, c.req.param("missionId"));
      return c.json(folder);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Échec liaison Drive.";
      return c.json({ error: message }, 502);
    }
  });

  app.post("/missions/:missionId/integrations/slack/channel", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const perm = requireIntegrations(c);
    if (perm) return perm;
    const body = (await c.req.json()) as { groupId?: string };
    if (!body.groupId) return c.json({ error: "groupId requis" }, 422);
    try {
      const result = await createMissionSlackChannel(c.req.param("missionId"), body.groupId);
      return c.json(result);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Échec création canal.";
      return c.json({ error: message }, 502);
    }
  });

  app.put("/missions/:missionId/integrations/slack/channel", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const perm = requireIntegrations(c);
    if (perm) return perm;
    const body = (await c.req.json()) as { channelId?: string };
    if (!body.channelId) return c.json({ error: "channelId requis" }, 422);
    try {
      await linkMissionSlackChannel(c.req.param("missionId"), body.channelId);
      return c.body(null, 204);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Échec liaison canal.";
      return c.json({ error: message }, 502);
    }
  });

  app.post("/missions/:missionId/integrations/slack/debug-message", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const perms = getMissionPermissions(c);
    if (!perms.canUseSlackDebug) {
      return c.json({ error: "forbidden", need: "super_admin" }, 403);
    }
    const body = (await c.req.json()) as { text?: string };
    try {
      await debugSendMissionSlackMessage(c.req.param("missionId"), body.text ?? "test");
      return c.body(null, 204);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Échec debug Slack.";
      return c.json({ error: message }, 502);
    }
  });

  app.post("/missions/:missionId/integrations/slack/debug-group-tag", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const perms = getMissionPermissions(c);
    if (!perms.canUseSlackDebug) {
      return c.json({ error: "forbidden", need: "super_admin" }, 403);
    }
    const body = (await c.req.json()) as { groupId?: string };
    if (!body.groupId) return c.json({ error: "groupId requis" }, 422);
    try {
      await debugSendMissionSlackGroupTagMessage(c.req.param("missionId"), body.groupId);
      return c.body(null, 204);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Échec debug Slack.";
      return c.json({ error: message }, 502);
    }
  });
}
