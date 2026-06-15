import { eq } from "drizzle-orm";
import type { Hono as HonoType } from "hono";
import { Hono } from "hono";

import { db } from "../../db";
import { actionPlanAxis } from "../../db/schema";
import {
  canDeleteActionPlan,
  canMutateActionPlan,
} from "../../lib/action-plan/access";
import type { AppVariables } from "../../types/app";
import {
  denyUnlessAuthenticated,
  parseOptionalInt,
  parseOptionalString,
  readJsonBody,
} from "./helpers";

export function registerActionPlanAxisRoutes(app: HonoType<{ Variables: AppVariables }>) {
  const router = new Hono<{ Variables: AppVariables }>();

  router.post("/axes", async (c) => {
    const denied = denyUnlessAuthenticated(c);
    if (denied) return denied;
    if (!canMutateActionPlan(c)) {
      return c.json({ error: "forbidden", need: "action_plan.write" }, 403);
    }

    const body = await readJsonBody(c);
    const title = parseOptionalString(body?.title);
    if (!title) return c.json({ error: "bad_request", message: "title requis" }, 400);

    const id = crypto.randomUUID();
    await db.insert(actionPlanAxis).values({
      id,
      title,
      description: parseOptionalString(body?.description) ?? "",
      sortOrder: parseOptionalInt(body?.sortOrder) ?? 0,
    });

    return c.json({ success: true, id }, 201);
  });

  router.patch("/axes/:id", async (c) => {
    const denied = denyUnlessAuthenticated(c);
    if (denied) return denied;
    if (!canMutateActionPlan(c)) {
      return c.json({ error: "forbidden", need: "action_plan.write" }, 403);
    }

    const id = c.req.param("id");
    const [existing] = await db
      .select()
      .from(actionPlanAxis)
      .where(eq(actionPlanAxis.id, id))
      .limit(1);
    if (!existing) return c.json({ error: "not_found" }, 404);

    const body = await readJsonBody(c);
    const patch: Partial<typeof actionPlanAxis.$inferInsert> = {};
    const title = parseOptionalString(body?.title);
    if (title) patch.title = title;
    const description = parseOptionalString(body?.description);
    if (description !== undefined) patch.description = description;
    const sortOrder = parseOptionalInt(body?.sortOrder);
    if (sortOrder !== undefined) patch.sortOrder = sortOrder;

    if (Object.keys(patch).length > 0) {
      await db.update(actionPlanAxis).set(patch).where(eq(actionPlanAxis.id, id));
    }

    return c.json({ success: true });
  });

  router.delete("/axes/:id", async (c) => {
    const denied = denyUnlessAuthenticated(c);
    if (denied) return denied;
    if (!canDeleteActionPlan(c)) {
      return c.json({ error: "forbidden", need: "action_plan.delete" }, 403);
    }

    const id = c.req.param("id");
    const result = await db.delete(actionPlanAxis).where(eq(actionPlanAxis.id, id));
    if (result.rowCount === 0) return c.json({ error: "not_found" }, 404);

    return c.json({ success: true });
  });

  app.route("/api/app/action-plan", router);
}
