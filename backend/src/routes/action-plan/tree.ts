import type { Hono as HonoType } from "hono";
import { Hono } from "hono";

import { canViewActionPlan } from "../../lib/action-plan/access";
import { getActionPlanTree } from "../../lib/action-plan/tree";
import type { AppVariables } from "../../types/app";
import { denyUnlessAuthenticated } from "./helpers";

export function registerActionPlanTreeRoutes(app: HonoType<{ Variables: AppVariables }>) {
  const router = new Hono<{ Variables: AppVariables }>();

  router.get("/tree", async (c) => {
    const denied = denyUnlessAuthenticated(c);
    if (denied) return denied;
    if (!canViewActionPlan(c)) {
      return c.json({ error: "forbidden", need: "action_plan.read" }, 403);
    }

    const result = await getActionPlanTree();
    return c.json(result);
  });

  app.route("/api/app/action-plan", router);
}
