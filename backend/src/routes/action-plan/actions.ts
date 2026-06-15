import { eq } from "drizzle-orm";
import type { Hono as HonoType } from "hono";
import { Hono } from "hono";

import { db } from "../../db";
import {
  actionPlanAction,
  actionPlanActionPole,
  actionPlanSmart,
} from "../../db/schema";
import {
  canDeleteActionPlan,
  canMutateActionPlan,
} from "../../lib/action-plan/access";
import type { AppVariables } from "../../types/app";
import {
  denyUnlessAuthenticated,
  parseCampus,
  parseIsoDate,
  parseOptionalInt,
  parseOptionalString,
  parsePoles,
  parseStatus,
  readJsonBody,
} from "./helpers";

async function syncActionPoles(actionId: string, poles: string[] | undefined) {
  if (poles === undefined) return;
  await db.delete(actionPlanActionPole).where(eq(actionPlanActionPole.actionId, actionId));
  if (poles.length > 0) {
    await db.insert(actionPlanActionPole).values(
      poles.map((pole) => ({
        actionId,
        pole: pole as (typeof actionPlanActionPole.$inferInsert)["pole"],
      })),
    );
  }
}

export function registerActionPlanActionRoutes(app: HonoType<{ Variables: AppVariables }>) {
  const router = new Hono<{ Variables: AppVariables }>();

  router.post("/actions", async (c) => {
    const denied = denyUnlessAuthenticated(c);
    if (denied) return denied;
    if (!canMutateActionPlan(c)) {
      return c.json({ error: "forbidden", need: "action_plan.write" }, 403);
    }

    const body = await readJsonBody(c);
    const smartId = parseOptionalString(body?.smartId);
    const title = parseOptionalString(body?.title);
    if (!smartId || !title) {
      return c.json({ error: "bad_request", message: "smartId et title requis" }, 400);
    }

    const [parent] = await db
      .select({ id: actionPlanSmart.id })
      .from(actionPlanSmart)
      .where(eq(actionPlanSmart.id, smartId))
      .limit(1);
    if (!parent) return c.json({ error: "not_found", message: "SMART introuvable" }, 404);

    const id = crypto.randomUUID();
    const status = parseStatus(body?.status) ?? "not_started";
    const campus = parseCampus(body?.campus);

    await db.insert(actionPlanAction).values({
      id,
      smartId,
      title,
      description: parseOptionalString(body?.description) ?? "",
      owner: parseOptionalString(body?.owner) ?? null,
      status,
      progress: Math.min(100, Math.max(0, parseOptionalInt(body?.progress) ?? 0)),
      priority: parseOptionalInt(body?.priority) ?? null,
      sortOrder: parseOptionalInt(body?.sortOrder) ?? 0,
      startDate: parseIsoDate(body?.startDate) ?? null,
      dueDate: parseIsoDate(body?.dueDate) ?? null,
      campus: campus === undefined ? null : campus,
    });

    await syncActionPoles(id, parsePoles(body?.poles));

    return c.json({ success: true, id }, 201);
  });

  router.patch("/actions/:id", async (c) => {
    const denied = denyUnlessAuthenticated(c);
    if (denied) return denied;
    if (!canMutateActionPlan(c)) {
      return c.json({ error: "forbidden", need: "action_plan.write" }, 403);
    }

    const id = c.req.param("id");
    const [existing] = await db
      .select()
      .from(actionPlanAction)
      .where(eq(actionPlanAction.id, id))
      .limit(1);
    if (!existing) return c.json({ error: "not_found" }, 404);

    const body = await readJsonBody(c);
    const patch: Partial<typeof actionPlanAction.$inferInsert> = {};
    const title = parseOptionalString(body?.title);
    if (title) patch.title = title;
    const description = parseOptionalString(body?.description);
    if (description !== undefined) patch.description = description;
    const owner = parseOptionalString(body?.owner);
    if (owner !== undefined) patch.owner = owner;
    const status = parseStatus(body?.status);
    if (status) patch.status = status;
    const progress = parseOptionalInt(body?.progress);
    if (progress !== undefined) patch.progress = Math.min(100, Math.max(0, progress));
    const priority = parseOptionalInt(body?.priority);
    if (priority !== undefined) patch.priority = priority;
    const sortOrder = parseOptionalInt(body?.sortOrder);
    if (sortOrder !== undefined) patch.sortOrder = sortOrder;
    const startDate = parseIsoDate(body?.startDate);
    if (startDate !== undefined) patch.startDate = startDate;
    const dueDate = parseIsoDate(body?.dueDate);
    if (dueDate !== undefined) patch.dueDate = dueDate;
    const campus = parseCampus(body?.campus);
    if (campus !== undefined) patch.campus = campus;

    if (Object.keys(patch).length > 0) {
      await db.update(actionPlanAction).set(patch).where(eq(actionPlanAction.id, id));
    }

    await syncActionPoles(id, parsePoles(body?.poles));

    return c.json({ success: true });
  });

  router.delete("/actions/:id", async (c) => {
    const denied = denyUnlessAuthenticated(c);
    if (denied) return denied;
    if (!canDeleteActionPlan(c)) {
      return c.json({ error: "forbidden", need: "action_plan.delete" }, 403);
    }

    const id = c.req.param("id");
    const result = await db.delete(actionPlanAction).where(eq(actionPlanAction.id, id));
    if (result.rowCount === 0) return c.json({ error: "not_found" }, 404);

    return c.json({ success: true });
  });

  app.route("/api/app/action-plan", router);
}
