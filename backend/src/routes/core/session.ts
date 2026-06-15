import type { Hono } from "hono";
import type { AppVariables } from "../../types/app";
import { isSuperAdminUserId } from "../../ubac";

export function registerSessionRoute(app: Hono<{ Variables: AppVariables }>) {
  app.get("/session", (c) => {
    const session = c.get("session");
    const user = c.get("user");
    if (!user) {
      return c.body(null, 401);
    }
    const permissions = c.get("sessionPermissions") ?? [];
    /** Ne pas exposer le jeton ni les métadonnées sensibles au JSON client (XSS). */
    const sessionPublic =
      session && typeof session === "object" && "id" in session && "expiresAt" in session
        ? {
            id: String(session.id),
            expiresAt:
              session.expiresAt instanceof Date
                ? session.expiresAt.toISOString()
                : String(session.expiresAt),
          }
        : null;

    return c.json({
      session: sessionPublic,
      user,
      permissions,
      isSuperAdmin: isSuperAdminUserId(user.id),
    });
  });
}
