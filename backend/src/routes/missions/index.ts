import { Hono } from "hono";
import type { Hono as HonoType } from "hono";

import type { AppVariables } from "../../types/app";
import { registerMissionsBcRoutes } from "./bcs";
import { registerMissionsCommercialRoutes } from "./commercial";
import { registerMissionsConfigRoutes } from "./config";
import { registerMissionsCrudRoutes } from "./crud";
import { registerMissionsDocRoutes } from "./docs";
import { registerMissionsIntegrationRoutes } from "./integrations";
import { registerMissionsListRoutes } from "./list";
import { registerMissionsTemplateRoutes } from "./templates";
import { registerMissionsWorkflowRoutes } from "./workflow";

/** Gestionnaire de Missions — routes `/api/app/missions/*`. */
export function registerMissionsRoutes(app: HonoType<{ Variables: AppVariables }>) {
  const router = new Hono<{ Variables: AppVariables }>();
  registerMissionsListRoutes(router);
  registerMissionsCrudRoutes(router);
  registerMissionsWorkflowRoutes(router);
  registerMissionsBcRoutes(router);
  registerMissionsCommercialRoutes(router);
  registerMissionsDocRoutes(router);
  registerMissionsTemplateRoutes(router);
  registerMissionsIntegrationRoutes(router);
  registerMissionsConfigRoutes(router);
  app.route("/api/app", router);
}
