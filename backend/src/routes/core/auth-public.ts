import { Hono } from "hono";

import { getEmailPasswordEnabled, isGoogleOAuthConfigured } from "../../lib/auth-policy";
import type { AppVariables } from "../../types/app";

export function registerAuthPublicRoutes(app: Hono<{ Variables: AppVariables }>) {
  const r = new Hono();

  r.get("/auth/config", async (c) => {
    const emailPasswordEnabled = await getEmailPasswordEnabled();
    return c.json({
      emailPasswordEnabled,
      googleOAuthEnabled: isGoogleOAuthConfigured(),
    });
  });

  app.route("/api/public", r);
}
