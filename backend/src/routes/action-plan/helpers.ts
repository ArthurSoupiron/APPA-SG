import type { Context } from "hono";

import {
  ACTION_PLAN_CAMPUSES,
  ACTION_PLAN_POLES,
  ACTION_PLAN_STATUSES,
  type ActionPlanCampus,
  type ActionPlanPole,
  type ActionPlanStatus,
} from "../../db/schema";
import type { AppVariables } from "../../types/app";

export function denyUnlessAuthenticated(c: {
  get: (k: "user") => AppVariables["user"];
  json: (b: unknown, s: number) => Response;
}): Response | null {
  const u = c.get("user");
  if (!u) return c.json({ error: "unauthorized" }, 401);
  return null;
}

export function parseOptionalString(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t || undefined;
}

export function parseOptionalInt(v: unknown): number | undefined {
  if (typeof v !== "number" || !Number.isFinite(v)) return undefined;
  return Math.trunc(v);
}

export function parseStatus(v: unknown): ActionPlanStatus | undefined {
  if (typeof v !== "string") return undefined;
  return ACTION_PLAN_STATUSES.includes(v as ActionPlanStatus)
    ? (v as ActionPlanStatus)
    : undefined;
}

export function parseCampus(v: unknown): ActionPlanCampus | null | undefined {
  if (v === null) return null;
  if (typeof v !== "string") return undefined;
  return ACTION_PLAN_CAMPUSES.includes(v as ActionPlanCampus)
    ? (v as ActionPlanCampus)
    : undefined;
}

export function parsePoles(v: unknown): ActionPlanPole[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out: ActionPlanPole[] = [];
  for (const item of v) {
    if (typeof item === "string" && ACTION_PLAN_POLES.includes(item as ActionPlanPole)) {
      out.push(item as ActionPlanPole);
    }
  }
  return out;
}

export function parseIsoDate(v: unknown): Date | null | undefined {
  if (v === null) return null;
  if (typeof v !== "string" || !v.trim()) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export type JsonRecord = Record<string, unknown>;

export async function readJsonBody(c: Context<{ Variables: AppVariables }>): Promise<JsonRecord | null> {
  return (await c.req.json().catch(() => null)) as JsonRecord | null;
}
