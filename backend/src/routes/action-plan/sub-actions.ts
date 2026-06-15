import { eq } from "drizzle-orm";
import type { Hono as HonoType } from "hono";
import { Hono } from "hono";

import { db } from "../../db";
import {
  actionPlanAction,
  actionPlanSubAction,
  actionPlanSubActionPole,
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

async function syncSubActionPoles(subActionId: string, poles: string[] | undefined) {
  if (poles === undefined) return;
  await db
    .delete(actionPlanSubActionPole)
    .where(eq(actionPlanSubActionPole.subActionId, subActionId));
  if (poles.length > 0) {
    await db.insert(actionPlanSubActionPole).values(
      poles.map((pole) => ({
        subActionId,
        pole: pole as (typeof actionPlanSubActionPole.$inferInsert)["pole"],
      })),
    );
  }
}

export function registerActionPlanSubActionRoutes(app: HonoType<{ Variables: AppVariables }>) {
  const router = new Hono<{ Variables: AppVariables }>();

  router.post("/sub-actions", async (c) => {
    const denied = denyUnlessAuthenticated(c);
    if (denied) return denied;
    if (!canMutateActionPlan(c)) {
      return c.json({ error: "forbidden", need: "action_plan.write" }, 403);
    }

    const body = await readJsonBody(c);
    const actionId = parseOptionalString(body?.actionId);
    const title = parseOptionalString(body?.title);
    if (!actionId || !title) {
      return c.json({ error: "bad_request", message: "actionId et title requis" }, 400);
    }

    const [parent] = await db
      .select({ id: actionPlanAction.id })
      .from(actionPlanAction)
      .where(eq(actionPlanAction.id, actionId))
      .limit(1);
    if (!parent) return c.json({ error: "not_found", message: "action introuvable" }, 404);

    const id = crypto.randomUUID();
    const status = parseStatus(body?.status) ?? "not_started";
    const campus = parseCampus(body?.campus);

    await db.insert(actionPlanSubAction).values({
      id,
      actionId,
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

    await syncSubActionPoles(id, parsePoles(body?.poles));

    return c.json({ success: true, id }, 201);
  });

  router.patch("/sub-actions/:id", async (c) => {
    const denied = denyUnlessAuthenticated(c);
    if (denied) return denied;
    if (!canMutateActionPlan(c)) {
      return c.json({ error: "forbidden", need: "action_plan.write" }, 403);
    }

    const id = c.req.param("id");
    const [existing] = await db
      .select()
      .from(actionPlanSubAction)
      .where(eq(actionPlanSubAction.id, id))
      .limit(1);
    if (!existing) return c.json({ error: "not_found" }, 404);

    const body = await readJsonBody(c);
    const patch: Partial<typeof actionPlanSubAction.$inferInsert> = {};
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
      await db.update(actionPlanSubAction).set(patch).where(eq(actionPlanSubAction.id, id));
    }

    await syncSubActionPoles(id, parsePoles(body?.poles));

    return c.json({ success: true });
  });

  router.delete("/sub-actions/:id", async (c) => {
    const denied = denyUnlessAuthenticated(c);
    if (denied) return denied;
    if (!canDeleteActionPlan(c)) {
      return c.json({ error: "forbidden", need: "action_plan.delete" }, 403);
    }

    const id = c.req.param("id");
    const result = await db
      .delete(actionPlanSubAction)
      .where(eq(actionPlanSubAction.id, id));
    if (result.rowCount === 0) return c.json({ error: "not_found" }, 404);

    return c.json({ success: true });
  });

  app.route("/api/app/action-plan", router);
}
