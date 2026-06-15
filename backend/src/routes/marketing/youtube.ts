import type { Hono as HonoType } from "hono";
import { Hono } from "hono";

import {
  getMarketingEnv,
  isMarketingIntegrationConfigured,
} from "../../lib/marketing/marketing-env";
import { guardMarketing } from "../../lib/marketing/marketing-http";
import {
  getLatestYouTubeCache,
  syncYouTube,
} from "../../lib/marketing/youtube-sync";
import type { AppVariables } from "../../types/app";

export function registerMarketingYouTubeRoutes(
  app: HonoType<{ Variables: AppVariables }>,
) {
  const r = new Hono<{ Variables: AppVariables }>();

  r.get("/youtube/status", async (c) => {
    const deny = guardMarketing(c, "marketing.read");
    if (deny) return deny;

    const env = getMarketingEnv();
    const latest = env.youtubeChannelId
      ? await getLatestYouTubeCache(env.youtubeChannelId)
      : null;

    return c.json({
      configured: isMarketingIntegrationConfigured("youtube"),
      channelId: env.youtubeChannelId || null,
      latest: latest
        ? {
            id: latest.id,
            fetchedAt: latest.fetchedAt.toISOString(),
            payload: latest.payload,
          }
        : null,
    });
  });

  r.post("/youtube/sync", async (c) => {
    const deny = guardMarketing(c, "marketing.write");
    if (deny) return deny;

    const force =
      c.req.query("force") === "1" || c.req.query("force") === "true";
    const user = c.get("user");
    if (!user) return c.json({ error: "unauthorized" }, 401);

    const env = getMarketingEnv();
    const result = await syncYouTube(env.youtubeChannelId, user.id, force);

    if (!result.ok) return c.json(result, 400);
    const latest = await getLatestYouTubeCache(env.youtubeChannelId);
    return c.json({ ...result, payload: latest?.payload ?? null });
  });

  app.route("/api/app/marketing", r);
}
