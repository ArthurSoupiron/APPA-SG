import type { Context } from "hono";

import { can } from "../ubac-http";
import type { AppVariables } from "../../types/app";

export function canViewActionPlan(c: Context<{ Variables: AppVariables }>): boolean {
  return can(c, "action_plan.read");
}

export function canMutateActionPlan(c: Context<{ Variables: AppVariables }>): boolean {
  return can(c, "action_plan.write");
}

export function canDeleteActionPlan(c: Context<{ Variables: AppVariables }>): boolean {
  return can(c, "action_plan.delete");
}

export function canManageActionPlan(c: Context<{ Variables: AppVariables }>): boolean {
  return can(c, "action_plan.manage");
}
