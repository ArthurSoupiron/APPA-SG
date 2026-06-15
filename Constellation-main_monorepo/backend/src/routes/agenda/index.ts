import type { Hono } from "hono";

import type { AppVariables } from "../../types/app";
import { registerAgendaEventRoutes } from "./events";
import { registerAgendaTypeRoutes } from "./types";
import { registerAgendaWorkspaceGroupRoutes } from "./workspace-groups";

export function registerAgendaRoutes(app: Hono<{ Variables: AppVariables }>) {
  registerAgendaEventRoutes(app);
  registerAgendaTypeRoutes(app);
  registerAgendaWorkspaceGroupRoutes(app);
}
