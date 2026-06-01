import type { Hono } from "hono";

import { getGoogleIntegrationStatus } from "../../lib/google-account-auth";
import type { AppVariables } from "../../types/app";

export function registerGoogleIntegrationRoutes(app: Hono<{ Variables: AppVariables }>) {
  app.get("/api/app/google/integration-status", async (c) => {
    const user = c.get("user");
    if (!user) return c.json({ error: "unauthorized" }, 401);
    const status = await getGoogleIntegrationStatus(user.id);
    return c.json(status);
  });
}
