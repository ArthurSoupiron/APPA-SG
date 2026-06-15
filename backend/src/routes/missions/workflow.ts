import type { Hono } from "hono";

import { listMissionDocumentEvents } from "../../lib/missions/audit-service";
import { getMissionBcDocsMatrix } from "../../lib/missions/docs-matrix-service";
import {
  getBcEditorData,
  listIntervenantOptions,
} from "../../lib/missions/mutation-service";
import { getWorkflowStateByMission } from "../../lib/missions/workflow-service";
import type { AppVariables } from "../../types/app";
import { requireMissionsRead, requireUser } from "./helpers";

export function registerMissionsWorkflowRoutes(app: Hono<{ Variables: AppVariables }>) {
  app.get("/missions/:missionId/workflow", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const perm = requireMissionsRead(c);
    if (perm) return perm;
    const workflow = await getWorkflowStateByMission(c.req.param("missionId"));
    return c.json(workflow);
  });

  app.get("/missions/:missionId/docs-matrix", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const perm = requireMissionsRead(c);
    if (perm) return perm;
    const user = c.get("user")!;
    try {
      const matrix = await getMissionBcDocsMatrix(user.id, c.req.param("missionId"));
      return c.json(matrix);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erreur matrice docs.";
      return c.json({ error: message }, 502);
    }
  });

  app.get("/missions/:missionId/events", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const perm = requireMissionsRead(c);
    if (perm) return perm;
    const events = await listMissionDocumentEvents(c.req.param("missionId"));
    return c.json(events);
  });

  app.get("/missions/:missionId/bcs/:bcId/editor", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const perm = requireMissionsRead(c);
    if (perm) return perm;
    try {
      const data = await getBcEditorData(c.req.param("missionId"), c.req.param("bcId"));
      return c.json(data);
    } catch (e) {
      const message = e instanceof Error ? e.message : "BC introuvable.";
      return c.json({ error: message }, 404);
    }
  });

  app.get("/missions/intervenants/options", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const perm = requireMissionsRead(c);
    if (perm) return perm;
    const options = await listIntervenantOptions();
    return c.json({ options });
  });
}
