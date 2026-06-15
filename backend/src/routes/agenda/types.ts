import { and, asc, eq } from "drizzle-orm";
import type { Hono as HonoType } from "hono";
import { Hono } from "hono";

import { db } from "../../db";
import { agendaEventType, type AgendaPole } from "../../db/schema";
import {
  buildAgendaAccessContext,
  canReadAgenda,
} from "../../lib/agenda/event-access";
import { agendaPoleManagePermission } from "../../lib/agenda/agenda-permissions";
import { parsePole } from "../../lib/agenda/event-mutations";
import { can } from "../../lib/ubac-http";
import { isSuperAdminUserId } from "../../ubac";
import type { AppVariables } from "../../types/app";

function denyUnlessAuth(c: { get: (k: "user") => AppVariables["user"]; json: (b: unknown, s: number) => Response }) {
  const u = c.get("user");
  if (!u) return c.json({ error: "unauthorized" }, 401);
  return null;
}

export function registerAgendaTypeRoutes(app: HonoType<{ Variables: AppVariables }>) {
  const router = new Hono<{ Variables: AppVariables }>();

  router.get("/", async (c) => {
    const denied = denyUnlessAuth(c);
    if (denied) return denied;
    if (!canReadAgenda(c)) return c.json({ error: "forbidden", need: "agenda.read" }, 403);

    const pole = parsePole(c.req.query("pole"));
    const rows = pole
      ? await db
          .select()
          .from(agendaEventType)
          .where(eq(agendaEventType.pole, pole))
          .orderBy(asc(agendaEventType.sortOrder))
      : await db.select().from(agendaEventType).orderBy(asc(agendaEventType.pole), asc(agendaEventType.sortOrder));

    return c.json({
      types: rows.map((t) => ({
        id: t.id,
        pole: t.pole,
        slug: t.slug,
        label: t.label,
        color: t.color,
        sortOrder: t.sortOrder,
        isActive: t.isActive,
      })),
    });
  });

  router.post("/", async (c) => {
    const denied = denyUnlessAuth(c);
    if (denied) return denied;
    const access = await buildAgendaAccessContext(c);
    if (!access) return c.json({ error: "unauthorized" }, 401);

    const body = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
    const pole = parsePole(body?.pole);
    if (!pole) return c.json({ error: "bad_request" }, 400);
    if (!can(c, agendaPoleManagePermission(pole)) && !access.isSuperAdmin) {
      return c.json({ error: "forbidden", need: agendaPoleManagePermission(pole) }, 403);
    }

    const slug = typeof body?.slug === "string" ? body.slug.trim().toLowerCase() : "";
    const label = typeof body?.label === "string" ? body.label.trim() : "";
    if (!slug || !label) return c.json({ error: "bad_request" }, 400);

    const id = crypto.randomUUID();
    await db.insert(agendaEventType).values({
      id,
      pole,
      slug,
      label,
      color: typeof body?.color === "string" ? body.color : null,
      sortOrder: typeof body?.sortOrder === "number" ? body.sortOrder : 0,
      isActive: true,
    });

    return c.json({ id, pole, slug, label }, 201);
  });

  router.patch("/:id", async (c) => {
    const denied = denyUnlessAuth(c);
    if (denied) return denied;
    const id = c.req.param("id");
    const [existing] = await db.select().from(agendaEventType).where(eq(agendaEventType.id, id)).limit(1);
    if (!existing) return c.json({ error: "not_found" }, 404);

    const user = c.get("user")!;
    if (!isSuperAdminUserId(user.id) && !can(c, agendaPoleManagePermission(existing.pole as AgendaPole))) {
      return c.json({ error: "forbidden" }, 403);
    }

    const body = (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
    const patch: Partial<typeof agendaEventType.$inferInsert> = {};
    if (typeof body?.label === "string") patch.label = body.label.trim();
    if (typeof body?.color === "string") patch.color = body.color;
    if (typeof body?.sortOrder === "number") patch.sortOrder = body.sortOrder;
    if (typeof body?.isActive === "boolean") patch.isActive = body.isActive;

    await db.update(agendaEventType).set(patch).where(eq(agendaEventType.id, id));
    return c.json({ ok: true });
  });

  router.delete("/:id", async (c) => {
    const denied = denyUnlessAuth(c);
    if (denied) return denied;
    const id = c.req.param("id");
    const [existing] = await db.select().from(agendaEventType).where(eq(agendaEventType.id, id)).limit(1);
    if (!existing) return c.json({ error: "not_found" }, 404);

    const user = c.get("user")!;
    if (!isSuperAdminUserId(user.id) && !can(c, agendaPoleManagePermission(existing.pole as AgendaPole))) {
      return c.json({ error: "forbidden" }, 403);
    }

    await db.update(agendaEventType).set({ isActive: false }).where(eq(agendaEventType.id, id));
    return c.json({ ok: true });
  });

  app.route("/api/app/agenda/types", router);
}
