import type { MiddlewareHandler } from "hono";

/** Logs des requêtes Better Auth (hors OPTIONS). */
export const authRequestLogMiddleware: MiddlewareHandler = async (c, next) => {
  if (c.req.method === "OPTIONS") {
    await next();
    return;
  }
  const started = Date.now();
  console.log(`[auth] → ${c.req.method} ${c.req.path}`);
  await next();
  console.log(`[auth] ← ${c.req.method} ${c.req.path} ${c.res.status} (${Date.now() - started}ms)`);
};
