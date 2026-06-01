import type { Hono as HonoType } from "hono";
import { Hono } from "hono";

import { getLatestLinkedInCache, syncLinkedIn } from "../../lib/marketing/linkedin-sync";
import { getMarketingEnv, isMarketingIntegrationConfigured } from "../../lib/marketing/marketing-env";
import { guardMarketing } from "../../lib/marketing/marketing-http";
import type { AppVariables } from "../../types/app";

export function registerMarketingLinkedInRoutes(app: HonoType<{ Variables: AppVariables }>) {
  const r = new Hono<{ Variables: AppVariables }>();

  r.get("/linkedin/status", async (c) => {
    const deny = guardMarketing(c, "marketing.read");
    if (deny) return deny;

    const env = getMarketingEnv();
    const latest = env.linkedinOrganizationId
      ? await getLatestLinkedInCache(env.linkedinOrganizationId)
      : null;

    return c.json({
      configured: isMarketingIntegrationConfigured("linkedin"),
      organizationId: env.linkedinOrganizationId || null,
      latest: latest
        ? { id: latest.id, fetchedAt: latest.fetchedAt.toISOString(), payload: latest.payload }
        : null,
    });
  });

  r.post("/linkedin/sync", async (c) => {
    const deny = guardMarketing(c, "marketing.write");
    if (deny) return deny;

    const force = c.req.query("force") === "1" || c.req.query("force") === "true";
    const user = c.get("user");
    const env = getMarketingEnv();
    const result = await syncLinkedIn(env.linkedinOrganizationId, user?.id ?? null, force);

    if (!result.ok) return c.json(result, 400);
    const latest = await getLatestLinkedInCache(env.linkedinOrganizationId);
    return c.json({ ...result, payload: latest?.payload ?? null });
  });

  app.route("/api/app/marketing", r);
}
