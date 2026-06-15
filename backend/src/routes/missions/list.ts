import type { Hono } from "hono";

import { getMissionCreateIntegrationOptions } from "../../lib/missions/integrations-service";
import { loadMissionCommercialInfosFromDriveFolder } from "../../lib/missions/mission-drive-infos-service";
import { getMissionsKpi } from "../../lib/missions/kpi-service";
import {
  getMissionById,
  getMissionFormOptions,
  getMissionsList,
  hydrateMissionsDocsMatricesForList,
} from "../../lib/missions/mission-list-service";
import type { AppVariables } from "../../types/app";
import {
  getMissionPermissions,
  requireMissionsRead,
  requireUser,
} from "./helpers";

export function registerMissionsListRoutes(app: Hono<{ Variables: AppVariables }>) {
  app.get("/missions", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const perm = requireMissionsRead(c);
    if (perm) return perm;
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "50", 10)));
    const missions = await getMissionsList(limit);
    return c.json({ missions });
  });

  app.get("/missions/kpi", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const perm = requireMissionsRead(c);
    if (perm) return perm;
    return c.json(await getMissionsKpi());
  });

  app.get("/missions/form-options", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const perm = requireMissionsRead(c);
    if (perm) return perm;
    return c.json(await getMissionFormOptions());
  });

  app.get("/missions/create-integration-options", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const perm = requireMissionsRead(c);
    if (perm) return perm;
    const user = c.get("user")!;
    return c.json(await getMissionCreateIntegrationOptions(user.id));
  });

  app.get("/missions/drive-folder/:folderId/commercial-infos", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const perm = requireMissionsRead(c);
    if (perm) return perm;
    const user = c.get("user")!;
    const result = await loadMissionCommercialInfosFromDriveFolder(
      user.id,
      c.req.param("folderId"),
    );
    if (result.error) {
      return c.json(result, 422);
    }
    return c.json(result);
  });

  app.get("/missions/permissions/me", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const perm = requireMissionsRead(c);
    if (perm) return perm;
    return c.json(getMissionPermissions(c));
  });

  app.get("/missions/:missionId", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const perm = requireMissionsRead(c);
    if (perm) return perm;
    const mission = await getMissionById(c.req.param("missionId"));
    if (!mission) return c.json({ error: "not_found" }, 404);
    return c.json(mission);
  });

  app.post("/missions/docs-matrix/hydrate", async (c) => {
    const deny = requireUser(c);
    if (deny) return deny;
    const perm = requireMissionsRead(c);
    if (perm) return perm;
    const body = (await c.req.json()) as { missionIds?: string[] };
    const missionIds = Array.isArray(body.missionIds) ? body.missionIds : [];
    const user = c.get("user")!;
    const slices = await hydrateMissionsDocsMatricesForList(user.id, missionIds);
    const record = Object.fromEntries(
      slices.map((s) => [
        s.missionId,
        { missionLevelDocs: s.missionLevelDocs, bcDocsMatrixRows: s.bcDocsMatrixRows },
      ]),
    );
    return c.json(record);
  });
}
