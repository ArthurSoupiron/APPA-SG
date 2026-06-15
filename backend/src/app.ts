import { Hono } from "hono";
import { auth } from "./auth";
import { getBackendEnv } from "./config/env";
import { apiCors } from "./lib/cors";
import { isPostgresUnavailable } from "./lib/pg-error";
import { getEmailPasswordEnabled } from "./lib/auth-policy";
import { authRequestLogMiddleware } from "./middleware/auth-request-log";
import { sessionMiddleware } from "./middleware/session";
/** Routes : `routes/core`, `routes/admin`, `routes/myster` (CRM), `routes/missions` (gestionnaire missions). */
import { registerAdminRoutes } from "./routes/admin";
import { registerCoreRoutes } from "./routes/core";
import { registerMarketingRoutes } from "./routes/marketing";
import { registerMysterRoutes } from "./routes/myster";
import { registerActionPlanRoutes } from "./routes/action-plan";
import { registerAgendaRoutes } from "./routes/agenda";
import { registerAssocRoutes } from "./routes/assoc";
import { registerSiRoutes } from "./routes/si";
import { registerMissionsRoutes } from "./routes/missions";
import type { AppVariables } from "./types/app";

export function createApp() {
  const { corsOrigin } = getBackendEnv();

  const app = new Hono<{ Variables: AppVariables }>();

  app.use("/api/auth/*", apiCors(corsOrigin));
  app.use("/api/app/*", apiCors(corsOrigin));
  app.use("/api/public/*", apiCors(corsOrigin));
  app.use("/session", apiCors(corsOrigin));

  app.use("/api/auth/*", authRequestLogMiddleware);

  const emailPasswordBlockedPaths = new Set([
    "/api/auth/sign-in/email",
    "/api/auth/sign-up/email",
    "/api/auth/forget-password",
  ]);

  app.use("/api/auth/*", async (c, next) => {
    if (c.req.method === "POST" && emailPasswordBlockedPaths.has(c.req.path)) {
      const enabled = await getEmailPasswordEnabled();
      if (!enabled) {
        return c.json({ error: "email_password_disabled" }, 403);
      }
    }
    return next();
  });

  app.use("*", async (c, next) => {
    if (c.req.path === "/health") {
      return next();
    }
    return sessionMiddleware(c, next);
  });

  app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

  registerCoreRoutes(app);
  registerAdminRoutes(app);
  registerMysterRoutes(app);
  registerMarketingRoutes(app);
  registerSiRoutes(app);
  registerAgendaRoutes(app);
  registerActionPlanRoutes(app);
  registerAssocRoutes(app);
  registerMissionsRoutes(app);

  app.onError((err, c) => {
    if (isPostgresUnavailable(err)) {
      console.error("[hono] base de données indisponible");
      return c.json(
        {
          error: "database_unavailable",
          message: "PostgreSQL est injoignable.",
        },
        503,
      );
    }
    console.error(err);
    return c.json({ error: "internal_server_error" }, 500);
  });

  return app;
}
