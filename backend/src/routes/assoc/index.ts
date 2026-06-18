import type { Hono } from "hono";

import type { AppVariables } from "../../types/app";
import { registerAssocDriveRoutes } from "./drive";
import { registerAssocStateRoutes } from "./state";

export function registerAssocRoutes(app: Hono<{ Variables: AppVariables }>) {
  registerAssocStateRoutes(app);
  registerAssocDriveRoutes(app);
}
