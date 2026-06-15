import type { Hono } from "hono";

import type { AppVariables } from "../../types/app";
import { registerAuthPublicRoutes } from "./auth-public";
import { registerAuthorizeRoutes } from "./authorize";
import { registerDriveRoutes } from "./drive";
import { registerGoogleIntegrationRoutes } from "./google-integration";
import { registerHealthRoutes } from "./health";
import { registerSessionRoute } from "./session";

/** Session, autorisation fine, santé — transverse à toutes les apps. */
export function registerCoreRoutes(app: Hono<{ Variables: AppVariables }>) {
  registerAuthPublicRoutes(app);
  registerSessionRoute(app);
  registerAuthorizeRoutes(app);
  registerDriveRoutes(app);
  registerGoogleIntegrationRoutes(app);
  registerHealthRoutes(app);
}
