import type { Hono } from "hono";

import type { AppVariables } from "../../types/app";
import { registerSiTicketRoutes } from "./tickets";

export function registerSiRoutes(app: Hono<{ Variables: AppVariables }>) {
  registerSiTicketRoutes(app);
}
