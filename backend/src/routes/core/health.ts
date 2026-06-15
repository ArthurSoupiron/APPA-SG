import type { Hono } from "hono";
import { pingDatabase } from "../../db";
import type { AppVariables } from "../../types/app";

const prod = process.env.NODE_ENV === "production";

export function registerHealthRoutes(app: Hono<{ Variables: AppVariables }>) {
  /** Endpoints de démo : désactivés en production pour limiter l’empreinte. */
  app.get("/", (c) => {
    if (prod) return c.body(null, 404);
    return c.text("Hello Hono!");
  });

  app.get("/api/hello", (c) => {
    if (prod) return c.body(null, 404);
    return c.json({
      ok: true,
      message: "Hello Hono!",
    });
  });

  /** Santé : ne passe pas par le middleware session (évite Better Auth / double hit DB). */
  app.get("/health", async (c) => {
    const database = (await pingDatabase()) ? "up" : "down";
    const ok = database === "up";
    return c.json(
      {
        ok,
        database,
        ...(prod ? {} : { service: "jarvis-backend" }),
      },
      ok ? 200 : 503,
    );
  });
}
