import { Hono } from "hono";

import {
  getAuthPolicy,
  isGoogleOAuthConfigured,
  setEmailPasswordEnabled,
} from "../../lib/auth-policy";
import type { AppVariables } from "../../types/app";
import { denyUnlessSuperAdmin } from "./ubac-admin";

export function registerAuthPolicyAdminRoutes(
  app: Hono<{ Variables: AppVariables }>,
) {
  const admin = new Hono<{ Variables: AppVariables }>();

  admin.get("/", async (c) => {
    const denied = denyUnlessSuperAdmin(c);
    if (denied) return denied;

    const policy = await getAuthPolicy();
    return c.json({
      emailPasswordEnabled: policy.emailPasswordEnabled,
      googleOAuthEnabled: isGoogleOAuthConfigured(),
      updatedAt: policy.updatedAt.toISOString(),
      updatedBy: policy.updatedBy,
    });
  });

  admin.patch("/", async (c) => {
    const denied = denyUnlessSuperAdmin(c);
    if (denied) return denied;

    const u = c.get("user")!;
    let body: { emailPasswordEnabled?: boolean };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "invalid_json" }, 400);
    }

    if (typeof body.emailPasswordEnabled !== "boolean") {
      return c.json({ error: "validation_error" }, 400);
    }

    const policy = await setEmailPasswordEnabled(
      body.emailPasswordEnabled,
      u.id,
    );
    return c.json({
      ok: true,
      emailPasswordEnabled: policy.emailPasswordEnabled,
      googleOAuthEnabled: isGoogleOAuthConfigured(),
      updatedAt: policy.updatedAt.toISOString(),
      updatedBy: policy.updatedBy,
    });
  });

  app.route("/api/app/admin/auth-policy", admin);
}
