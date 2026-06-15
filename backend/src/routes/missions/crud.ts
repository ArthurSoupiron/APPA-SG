import type { Hono } from "hono";

import { createMission, updateMission } from "../../lib/missions/mission-list-service";
import type { CreateMissionInput, UpdateMissionInput } from "../../types/missions";
import type { AppVariables } from "../../types/app";
import { requireBcStructure, requireUser } from "./helpers";

export function registerMissionsCrudRoutes(app: Hono<{ Variables: AppVariables }>) {
  app.post("/missions", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const perm = requireBcStructure(c);
    if (perm) return perm;
    const body = (await c.req.json()) as CreateMissionInput;
    if (!body.missionName?.trim() || !body.clientId || !body.entrepriseId) {
      return c.json({ error: "validation", message: "Champs requis manquants." }, 422);
    }
    const user = c.get("user")!;
    try {
      const result = await createMission(body, user.id);
      return c.json(result, 201);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erreur création mission.";
      return c.json({ error: message }, 422);
    }
  });

  app.patch("/missions/:missionId", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const perm = requireBcStructure(c);
    if (perm) return perm;
    const body = (await c.req.json()) as UpdateMissionInput;
    const missionId = c.req.param("missionId");
    if (!body.missionName?.trim() || !body.clientId || !body.entrepriseId) {
      return c.json({ error: "validation", message: "Champs requis manquants." }, 422);
    }
    const user = c.get("user")!;
    try {
      await updateMission({ ...body, id: missionId }, user.id);
      return c.body(null, 204);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erreur mise à jour.";
      return c.json({ error: message }, 422);
    }
  });
}
