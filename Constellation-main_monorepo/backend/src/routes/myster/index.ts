import type { Hono } from "hono";

import type { AppVariables } from "../../types/app";
import { registerCrmKpiRoutes } from "./crm-kpi";
import { registerCrmProspectRoutes } from "./crm-prospects";
import { registerCrmSprintRoutes } from "./crm-sprints";

/** Myster (CRM) : prospects, sprints, KPI. */
export function registerMysterRoutes(app: Hono<{ Variables: AppVariables }>) {
  registerCrmProspectRoutes(app);
  registerCrmSprintRoutes(app);
  registerCrmKpiRoutes(app);
}
