import type { Hono } from "hono";

import type { AppVariables } from "../../types/app";
import { registerActionPlanActionRoutes } from "./actions";
import { registerActionPlanAxisRoutes } from "./axes";
import { registerActionPlanImportExportRoutes } from "./import-export";
import { registerActionPlanSmartRoutes } from "./smarts";
import { registerActionPlanSubActionRoutes } from "./sub-actions";
import { registerActionPlanSubAxisRoutes } from "./sub-axes";
import { registerActionPlanTreeRoutes } from "./tree";

export function registerActionPlanRoutes(app: Hono<{ Variables: AppVariables }>) {
  registerActionPlanTreeRoutes(app);
  registerActionPlanAxisRoutes(app);
  registerActionPlanSubAxisRoutes(app);
  registerActionPlanSmartRoutes(app);
  registerActionPlanActionRoutes(app);
  registerActionPlanSubActionRoutes(app);
  registerActionPlanImportExportRoutes(app);
}
