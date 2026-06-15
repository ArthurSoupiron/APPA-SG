import type { Hono } from "hono";

import type { AppVariables } from "../../types/app";
import { registerAuthPolicyAdminRoutes } from "./auth-policy";
import { registerGwOpsRoutes } from "./gw-ops";
import { registerSlackOpsRoutes } from "./slack-ops";
import { registerUbacAdminRoutes } from "./ubac-admin";

/** Super-admin : Google Workspace / jobs / bannières, puis membres & catalogue UBAC. */
export function registerAdminRoutes(app: Hono<{ Variables: AppVariables }>) {
  registerAuthPolicyAdminRoutes(app);
  registerGwOpsRoutes(app);
  registerSlackOpsRoutes(app);
  registerUbacAdminRoutes(app);
}
