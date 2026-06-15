import type { Context } from "hono";

import {
  canDeleteSiRegistres,
  canMutateSiRegistres,
  canViewSiRegistres,
} from "../../../lib/si-registres/access";
import type { AppVariables } from "../../../types/app";

export function denyUnlessAuthenticated(c: {
  get: (k: "user") => AppVariables["user"];
  json: (b: unknown, s: number) => Response;
}): Response | null {
  const u = c.get("user");
  if (!u) return c.json({ error: "unauthorized" }, 401);
  return null;
}

export function denyUnlessView(c: Context<{ Variables: AppVariables }>): Response | null {
  if (!canViewSiRegistres(c)) {
    return c.json({ error: "forbidden", need: "si.registres.read" }, 403);
  }
  return null;
}

export function denyUnlessMutate(c: Context<{ Variables: AppVariables }>): Response | null {
  if (!canMutateSiRegistres(c)) {
    return c.json({ error: "forbidden", need: "si.registres.write" }, 403);
  }
  return null;
}

export function denyUnlessDelete(c: Context<{ Variables: AppVariables }>): Response | null {
  if (!canDeleteSiRegistres(c)) {
    return c.json({ error: "forbidden", need: "si.registres.delete" }, 403);
  }
  return null;
}

export async function readJsonBody(
  c: Context<{ Variables: AppVariables }>,
): Promise<Record<string, unknown> | null> {
  return (await c.req.json().catch(() => null)) as Record<string, unknown> | null;
}
