import type { Context } from "hono";

import type { AppVariables } from "../../types/app";

export function denyUnlessAuthenticated(c: Context<{ Variables: AppVariables }>): Response | null {
  const u = c.get("user");
  if (!u) return c.json({ error: "unauthorized" }, 401);
  return null;
}

export async function readJsonBody(
  c: Context<{ Variables: AppVariables }>,
): Promise<Record<string, unknown> | null> {
  return (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
}

export function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

export function asInt(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

export function asBool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}

export function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

export function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
