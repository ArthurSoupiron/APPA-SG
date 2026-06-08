import type { MiddlewareHandler } from "hono";

import type { AppVariables } from "../types/app";

const WINDOW_MS = 60_000;
const MAX_IN_WINDOW = 120;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function prune(now: number) {
  if (buckets.size < 10_000) return;
  for (const [k, b] of buckets) {
    if (b.resetAt < now) buckets.delete(k);
  }
}

function clientIp(c: { req: { header: (n: string) => string | undefined } }): string {
  const xff = c.req.header("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return c.req.header("cf-connecting-ip") ?? "unknown";
}

/**
 * Limite légère sur /api/app/authorize (GET/POST) : comptes déjà authentifiés
 * ou IP pour les 401 — réduit le sondage automatisé des permissions.
 */
export const authorizeRateLimitMiddleware: MiddlewareHandler<{
  Variables: AppVariables;
}> = async (c, next) => {
  const now = Date.now();
  prune(now);

  const user = c.get("user");
  const key = user ? `u:${user.id}` : `ip:${clientIp(c)}`;
  let b = buckets.get(key);
  if (!b || b.resetAt < now) {
    b = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(key, b);
  }
  b.count += 1;
  if (b.count > MAX_IN_WINDOW) {
    return c.json({ ok: false as const, error: "rate_limited" }, 429);
  }
  await next();
};
