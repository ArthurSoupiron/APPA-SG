import { eq } from "drizzle-orm";
import type { Hono as HonoType } from "hono";
import { Hono } from "hono";

import { db } from "../../db";
import { actionPlanSmart, actionPlanSubAxis } from "../../db/schema";
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

export function registerActionPlanSmartRoutes(app: HonoType<{ Variables: AppVariables }>) {
  const router = new Hono<{ Variables: AppVariables }>();

  router.post("/smarts", async (c) => {
    const denied = denyUnlessAuthenticated(c);
    if (denied) return denied;
    if (!canMutateActionPlan(c)) {
      return c.json({ error: "forbidden", need: "action_plan.write" }, 403);
    }

    const body = await readJsonBody(c);
    const subAxisId = parseOptionalString(body?.subAxisId);
    const title = parseOptionalString(body?.title);
    if (!subAxisId || !title) {
      return c.json({ error: "bad_request", message: "subAxisId et title requis" }, 400);
    }

    const [parent] = await db
      .select({ id: actionPlanSubAxis.id })
      .from(actionPlanSubAxis)
      .where(eq(actionPlanSubAxis.id, subAxisId))
      .limit(1);
    if (!parent) return c.json({ error: "not_found", message: "sous-axe introuvable" }, 404);

    const id = crypto.randomUUID();
    await db.insert(actionPlanSmart).values({
      id,
      subAxisId,
      title,
      description: parseOptionalString(body?.description) ?? "",
      sortOrder: parseOptionalInt(body?.sortOrder) ?? 0,
    });

    return c.json({ success: true, id }, 201);
  });

  router.patch("/smarts/:id", async (c) => {
    const denied = denyUnlessAuthenticated(c);
    if (denied) return denied;
    if (!canMutateActionPlan(c)) {
      return c.json({ error: "forbidden", need: "action_plan.write" }, 403);
    }

    const id = c.req.param("id");
    const [existing] = await db
      .select()
      .from(actionPlanSmart)
      .where(eq(actionPlanSmart.id, id))
      .limit(1);
    if (!existing) return c.json({ error: "not_found" }, 404);

    const body = await readJsonBody(c);
    const patch: Partial<typeof actionPlanSmart.$inferInsert> = {};
    const title = parseOptionalString(body?.title);
    if (title) patch.title = title;
    const description = parseOptionalString(body?.description);
    if (description !== undefined) patch.description = description;
    const sortOrder = parseOptionalInt(body?.sortOrder);
    if (sortOrder !== undefined) patch.sortOrder = sortOrder;

    if (Object.keys(patch).length > 0) {
      await db.update(actionPlanSmart).set(patch).where(eq(actionPlanSmart.id, id));
    }

    return c.json({ success: true });
  });

  router.delete("/smarts/:id", async (c) => {
    const denied = denyUnlessAuthenticated(c);
    if (denied) return denied;
    if (!canDeleteActionPlan(c)) {
      return c.json({ error: "forbidden", need: "action_plan.delete" }, 403);
    }

    const id = c.req.param("id");
    const result = await db.delete(actionPlanSmart).where(eq(actionPlanSmart.id, id));
    if (result.rowCount === 0) return c.json({ error: "not_found" }, 404);

    return c.json({ success: true });
  });

  app.route("/api/app/action-plan", router);
}
