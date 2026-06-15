import type { Hono } from "hono";

import {
  assignDesignationIntervenant,
  createBc,
  updateBc,
  updateBcStructure,
} from "../../lib/missions/mutation-service";
import type { AppVariables } from "../../types/app";
import { mutationErrorResponse, requireBcStructure, requireUser } from "./helpers";

export function registerMissionsBcRoutes(app: Hono<{ Variables: AppVariables }>) {
  app.post("/missions/:missionId/bcs", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const perm = requireBcStructure(c);
    if (perm) return perm;
    const user = c.get("user")!;
    const body = await c.req.json();
    try {
      await createBc(c.req.param("missionId"), user.id, body);
      return c.body(null, 204);
    } catch (e) {
      return mutationErrorResponse(c, e);
    }
  });

  app.patch("/missions/:missionId/bcs/:bcId", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const perm = requireBcStructure(c);
    if (perm) return perm;
    const user = c.get("user")!;
    const body = await c.req.json();
    try {
      await updateBc(c.req.param("missionId"), c.req.param("bcId"), user.id, body, body.reason);
      return c.body(null, 204);
    } catch (e) {
      return mutationErrorResponse(c, e);
    }
  });

  app.put("/missions/:missionId/bcs/:bcId/structure", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const perm = requireBcStructure(c);
    if (perm) return perm;
    const user = c.get("user")!;
    const body = await c.req.json();
    try {
      await updateBcStructure(c.req.param("missionId"), c.req.param("bcId"), user.id, body);
      return c.body(null, 204);
    } catch (e) {
      return mutationErrorResponse(c, e);
    }
  });

  app.patch("/missions/:missionId/bcs/:bcId/designations/:desId/intervenant", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const perm = requireBcStructure(c);
    if (perm) return perm;
    const user = c.get("user")!;
    const body = (await c.req.json()) as { intervenantId?: string | null };
    try {
      await assignDesignationIntervenant(
        c.req.param("missionId"),
        c.req.param("bcId"),
        c.req.param("desId"),
        body.intervenantId ?? null,
        user.id,
      );
      return c.body(null, 204);
    } catch (e) {
      return mutationErrorResponse(c, e);
    }
  });
}
