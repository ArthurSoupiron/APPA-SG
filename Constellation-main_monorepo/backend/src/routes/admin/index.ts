import type { Hono } from "hono";

import type { AppVariables } from "../../types/app";
import { registerGwOpsRoutes } from "./gw-ops";
import { registerUbacAdminRoutes } from "./ubac-admin";

/** Super-admin : Google Workspace / jobs / bannières, puis membres & catalogue UBAC. */
export function registerAdminRoutes(app: Hono<{ Variables: AppVariables }>) {
  registerGwOpsRoutes(app);
  registerUbacAdminRoutes(app);
}
