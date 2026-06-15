import type { Hono as HonoType } from "hono";
import { Hono } from "hono";
import { can } from "../../lib/ubac-http";
import { authorizeRateLimitMiddleware } from "../../middleware/authorize-rate-limit";
import type { AppVariables } from "../../types/app";
import { PERMISSIONS, type Permission } from "../../ubac";

const KNOWN = new Set<string>(PERMISSIONS);

function isPermissionString(p: string): p is Permission {
  return KNOWN.has(p);
}

/**
 * Vérification serveur : le front Next appelle ces routes (cookies) avant de charger du code client métier.
 * Rate limit léger : voir `middleware/authorize-rate-limit.ts`.
 */
export function registerAuthorizeRoutes(app: HonoType<{ Variables: AppVariables }>) {
  const r = new Hono<{ Variables: AppVariables }>();

  r.use("*", authorizeRateLimitMiddleware);

  r.get("/", (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ ok: false as const, error: "unauthorized" }, 401);
    }
    const raw = c.req.query("permission");
    if (!raw || !isPermissionString(raw)) {
      return c.json({ ok: false as const, error: "invalid_permission" }, 400);
    }
    if (!can(c, raw)) {
      return c.json({ ok: false as const, error: "forbidden" }, 403);
    }
    return c.json({ ok: true as const });
  });

  r.post("/", async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ ok: false as const, error: "unauthorized" }, 401);
    }

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ ok: false as const, error: "invalid_json" }, 400);
    }

    if (body === null || typeof body !== "object" || Array.isArray(body)) {
      return c.json({ ok: false as const, error: "invalid_body" }, 400);
    }

    const rec = body as Record<string, unknown>;
    const mode = rec.mode === "all" ? "all" : "any";
    const permsRaw = rec.permissions;
    if (!Array.isArray(permsRaw) || permsRaw.length === 0 || permsRaw.length > 64) {
      return c.json({ ok: false as const, error: "invalid_permissions" }, 400);
    }

    const perms: Permission[] = [];
    for (const x of permsRaw) {
      if (typeof x !== "string" || !isPermissionString(x)) {
        return c.json({ ok: false as const, error: "unknown_permission" }, 400);
      }
      perms.push(x);
    }

    const allowed = mode === "any" ? perms.some((p) => can(c, p)) : perms.every((p) => can(c, p));

    if (!allowed) {
      return c.json({ ok: false as const, error: "forbidden" }, 403);
    }
    return c.json({ ok: true as const });
  });

  app.route("/api/app/authorize", r);
}
