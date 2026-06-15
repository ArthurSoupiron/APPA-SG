import type { Hono as HonoType } from "hono";
import { Hono } from "hono";

import { canReadAgenda } from "../../lib/agenda/event-access";
import { listUbacWorkspaceGroups } from "../../lib/agenda/workspace-groups";
import type { AppVariables } from "../../types/app";

export function registerAgendaWorkspaceGroupRoutes(app: HonoType<{ Variables: AppVariables }>) {
  const router = new Hono<{ Variables: AppVariables }>();

  router.get("/", async (c) => {
    if (!c.get("user")) return c.json({ error: "unauthorized" }, 401);
    if (!canReadAgenda(c)) return c.json({ error: "forbidden", need: "agenda.read" }, 403);

    const groups = await listUbacWorkspaceGroups();
    return c.json({ groups });
  });

  app.route("/api/app/agenda/workspace-groups", router);
}
